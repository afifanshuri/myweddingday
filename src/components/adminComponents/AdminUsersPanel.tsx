"use client";

import { useEffect, useState } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import CustomDialog from "@/components/commonComponents/CustomDialog";
import AccountStatus from "@/components/commonComponents/AccountStatus";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import { APIGetUsersAll, APIUpdateUserAccess, type AccountUser, type AccessUpdate } from "@/services/api/account";
import { PLANS } from "@/config/plans";

export default function UsersPage() {
  const { access, checking, revision } = useAccountAccess();
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<{ users: AccountUser[]; page: number; hasNext: boolean; revision: number } | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<{ user: AccountUser; update: AccessUpdate } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (checking || access.role !== "admin") return;
    const controller = new AbortController();
    APIGetUsersAll(page, controller.signal).then((data) => {
      if (!controller.signal.aborted) { setResult({ ...data, revision }); setError(""); }
    }).catch((error: Error) => { if (!controller.signal.aborted) { setResult(null); setError(error.message); } });
    return () => { controller.abort(); setResult(null); setPending(null); };
  }, [page, reload, checking, access.role, revision]);
  const visible = !checking && access.role === "admin" && result?.page === page && result.revision === revision;
  async function save() {
    if (!pending) return;
    setBusy(true); setError("");
    try { await APIUpdateUserAccess(pending.user.userId!, pending.update); setPending(null); setReload((value) => value + 1); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to update access"); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="libre-font text-3xl text-(--positive-tertiary)">Users & access</h1>
        <p className="mt-2 text-sm text-foreground/65">Manage account roles and one-year Plus passes.</p></div>
      <AccountStatus />
    </div>
    {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
    {!visible ? <p role="status" className="py-8">{error ? "Accounts could not be loaded." : "Loading accounts…"}</p> : <>
      <ul className="mt-6 divide-y divide-(--tertiary) overflow-hidden rounded-xl border border-(--tertiary) bg-white">
        {result.users.map((user) => <li key={user.userId} className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
          <div className="min-w-0"><p className="break-all font-medium">{user.email || "No email"}{user.userId === access.userId && <span className="text-xs text-foreground/50"> (you)</span>}</p>
            <p className="mt-1 text-xs text-foreground/60">{user.isPaid ? "Paid" : "Free"} · {user.paidUntil ? `Pass expiry: ${new Date(user.paidUntil).toLocaleDateString("en-MY")}` : "No pass"}{user.role === "admin" && " · Admin access"}</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs">Role
              <select aria-label={`Role for ${user.email}`} value={user.role ?? "user"} disabled={busy || user.userId === access.userId}
                className="rounded-lg border border-(--tertiary) bg-white p-2 text-sm"
                onChange={(event) => setPending({ user, update: { action: "setRole", role: event.target.value as "user" | "admin" } })}>
                <option value="user">User</option><option value="admin">Admin</option>
              </select>
            </label>
            <MainButton size="small" variant="secondary" disabled={busy} onClick={() => setPending({ user, update: { action: "grantPass" } })}>Grant {PLANS.plus.durationYears} year</MainButton>
            <MainButton size="small" variant="ghost" disabled={busy || !user.isPaid} onClick={() => setPending({ user, update: { action: "revokePass" } })}>Revoke pass</MainButton>
          </div>
        </li>)}
        {!result.users.length && <li className="p-5 text-sm">No accounts found.</li>}
      </ul>
      <nav aria-label="Account pages" className="mt-5 flex items-center justify-between gap-3">
        <MainButton variant="secondary" size="small" disabled={page === 1 || busy} onClick={() => setPage(page - 1)}>Previous</MainButton>
        <span className="text-sm">Page {page}</span>
        <MainButton variant="secondary" size="small" disabled={!result.hasNext || busy} onClick={() => setPage(page + 1)}>Next</MainButton>
      </nav>
    </>}
    <CustomDialog open={!!pending && !checking && access.role === "admin"} busy={busy} onClose={() => setPending(null)} onConfirm={save} title="Update account access">
      <p className="break-words text-sm">{pending?.update.action === "setRole" ? `Change role to ${pending.update.role}` : pending?.update.action === "grantPass" ? `Grant a pass lasting ${PLANS.plus.durationYears} year from today` : "Revoke the active pass"} for {pending?.user.email}?</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </CustomDialog>
  </main>;
}
