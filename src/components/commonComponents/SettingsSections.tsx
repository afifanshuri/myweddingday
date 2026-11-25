"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { FiAlertTriangle, FiArrowRight, FiDownload, FiLogOut, FiMonitor, FiStar } from "react-icons/fi";
import MainButton from "./MainButton";
import { useAccountAccess } from "./AccountAccessProvider";
import { authInputClass } from "@/components/authComponents/AuthCard";
import { APIDeleteAuthSession, APIEndAllAuthSessions } from "@/services/api/auth";
import { APIDeleteAccount } from "@/services/api/plan";
import { clearLocalPlan, flushPlan } from "@/store/planSync";
import { ROUTES, paymentRoute } from "@/config/routes";
import { PLANS } from "@/config/plans";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/config/auth";

const longDate = (value: string) => new Date(value).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });

export function SettingsCard({ title, icon, children, tone = "plain" }: { title: string; icon: ReactNode; children: ReactNode; tone?: "plain" | "danger" }) {
  return <section aria-label={title} className={`rounded-2xl border bg-white p-5 sm:p-6 ${tone === "danger" ? "border-red-200" : "border-(--tertiary)"}`}>
    <h2 className={`mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${tone === "danger" ? "text-red-700" : "text-foreground/55"}`}>{icon}{title}</h2>
    {children}
  </section>;
}

/** The account's plan. Plus is a one-time pass for a set period (no automatic renewal), so there's nothing to cancel. */
export function PlanSettings() {
  const { access, checking } = useAccountAccess();
  if (checking) return <SettingsCard title="Plan" icon={<FiStar aria-hidden="true" />}><p className="text-sm text-foreground/50">Checking…</p></SettingsCard>;
  const admin = access.role === "admin";
  return <SettingsCard title="Plan" icon={<FiStar aria-hidden="true" />}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-base font-medium text-(--positive-tertiary)">{admin ? "Admin" : access.isPaid ? "Plus" : "Free"}</p>
        <p className="mt-0.5 text-sm text-foreground/60">
          {admin ? "Every vendor detail is visible."
            : access.isPaid ? `Active until ${access.paidUntil ? longDate(access.paidUntil) : "further notice"}. No automatic renewal.`
            : "One search, one vendor per service."}
        </p>
      </div>
      {!admin && <Link href={paymentRoute(ROUTES.settings)} className="main-button main-button--primary main-button--size-small inline-flex items-center gap-2">
        {access.isPaid ? "Extend" : `Get Plus · RM${PLANS.plus.priceMYR}`} <FiArrowRight aria-hidden="true" />
      </Link>}
    </div>
  </SettingsCard>;
}

/** Sign out here, or on every device (for a lost phone or a shared computer). */
export function SessionSettings() {
  const [busy, setBusy] = useState<"here" | "everywhere" | null>(null);
  const [error, setError] = useState("");
  async function signOut(scope: "here" | "everywhere") {
    if (busy) return;
    setBusy(scope);
    setError("");
    try {
      await flushPlan().catch(() => undefined);
      const { error } = scope === "everywhere" ? await APIEndAllAuthSessions() : await APIDeleteAuthSession();
      if (error) throw error;
      clearLocalPlan();
      window.location.replace(ROUTES.home);
    } catch {
      setError("Unable to sign out. Please try again.");
      setBusy(null);
    }
  }
  return <SettingsCard title="Sessions" icon={<FiMonitor aria-hidden="true" />}>
    <div className="flex flex-wrap gap-3">
      <MainButton variant="secondary" size="small" disabled={!!busy} onClick={() => signOut("here")}>
        <FiLogOut aria-hidden="true" /> {busy === "here" ? "Signing out…" : "Sign out"}
      </MainButton>
      <MainButton variant="secondary" size="small" disabled={!!busy} onClick={() => signOut("everywhere")}>
        <FiMonitor aria-hidden="true" /> {busy === "everywhere" ? "Signing out…" : "Sign out of all devices"}
      </MainButton>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </SettingsCard>;
}

/** A copy of everything kept for the account, as a JSON file. */
export function DataSettings() {
  return <SettingsCard title="Your data" icon={<FiDownload aria-hidden="true" />}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-foreground/60">Plan, shortlist, chosen packages and searches.</p>
      <a href="/api/account/export" download className="main-button main-button--secondary main-button--size-small inline-flex items-center gap-2">
        <FiDownload aria-hidden="true" /> Download
      </a>
    </div>
  </SettingsCard>;
}

/** Permanently deletes the account and everything saved with it, after the password and a typed confirmation. */
export function DeleteAccountSettings() {
  const { access } = useAccountAccess();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const admin = access.role === "admin";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await APIDeleteAccount(String(form.get("password") ?? ""), String(form.get("confirmation") ?? "").trim());
      clearLocalPlan();
      await APIDeleteAuthSession().catch(() => undefined);
      window.location.replace(ROUTES.home);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete your account. Please try again.");
      setBusy(false);
    }
  }

  return <SettingsCard title="Delete account" icon={<FiAlertTriangle aria-hidden="true" />} tone="danger">
    {admin ? <p className="text-sm text-foreground/60">Admin accounts are removed by another admin.</p>
      : !open ? <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-foreground/60">Permanently removes your account and plan.</p>
        <MainButton variant="danger" size="small" onClick={() => setOpen(true)}>Delete account</MainButton>
      </div>
      : <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/70">
          <li>Your plan, shortlist, chosen packages and searches are deleted.</li>
          {access.isPaid && <li>Your Plus pass ends and isn&apos;t refunded.</li>}
          <li>This can&apos;t be undone.</li>
        </ul>
        <label className="block text-sm text-stone-700">
          Password
          <input type="password" name="password" autoComplete="current-password" required disabled={busy} className={authInputClass} />
        </label>
        <label className="block text-sm text-stone-700">
          Type <span className="font-semibold">{DELETE_ACCOUNT_CONFIRMATION}</span> to confirm
          <input name="confirmation" autoComplete="off" required pattern={DELETE_ACCOUNT_CONFIRMATION} disabled={busy} className={authInputClass} />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <MainButton type="submit" variant="danger" size="small" disabled={busy}>{busy ? "Deleting…" : "Delete permanently"}</MainButton>
          <MainButton variant="ghost" size="small" disabled={busy} onClick={() => { setOpen(false); setError(""); }}>Cancel</MainButton>
        </div>
      </form>}
  </SettingsCard>;
}
