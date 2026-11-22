"use client";

import { useEffect, useState } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";
import CustomDialog from "@/components/commonComponents/CustomDialog";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import { APICancelSubmissionLink, APICreateSubmissionLink, APIListSubmissionLinks, type SubmissionLink, type VendorMessage } from "@/services/api/adminVendors";
import { SUBMISSION_LINK, SUBMISSION_LINK_STATE_LABELS, type SubmissionLinkState } from "@/config/submissionLinks";
import { adminVendorRoute } from "@/config/routes";
import CopyBox from "./CopyBox";

const STATE_STYLES: Record<SubmissionLinkState, string> = {
  open: "border-amber-300 bg-amber-50 text-amber-800",
  reopened: "border-amber-300 bg-amber-50 text-amber-800",
  submitted: "border-(--positive-secondary) bg-(--positive)/20 text-(--positive-tertiary)",
  closed: "border-(--tertiary) bg-(--background) text-foreground/60",
  cancelled: "border-(--tertiary) bg-(--background) text-foreground/60",
};
const day = (value: string) => new Date(value).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });

/** Admin page: create links for vendors to submit their own listing, and see or cancel existing ones. */
export default function SubmissionLinksPanel() {
  const { access, checking } = useAccountAccess();
  const [links, setLinks] = useState<SubmissionLink[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ label: string; url: string; message: VendorMessage } | null>(null);
  const [cancelling, setCancelling] = useState<SubmissionLink | null>(null);

  useEffect(() => {
    if (checking || access.role !== "admin") return;
    const controller = new AbortController();
    APIListSubmissionLinks(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setLinks(data); })
      .catch((cause: Error) => { if (!controller.signal.aborted) setLoadError(cause.message); });
    return () => controller.abort();
  }, [checking, access.role]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await APICreateSubmissionLink(label.trim(), email.trim());
      setCreated({ label: result.link.label, url: result.url, message: result.message });
      setLinks((current) => [result.link, ...(current ?? [])]);
      setLabel("");
      setEmail("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create link");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!cancelling || busy) return;
    setBusy(true);
    setError("");
    try {
      const updated = await APICancelSubmissionLink(cancelling.id);
      setLinks((current) => current?.map((link) => link.id === updated.id ? { ...link, ...updated, vendorName: link.vendorName } : link) ?? null);
      setCancelling(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to cancel link");
    } finally {
      setBusy(false);
    }
  }

  const expired = (link: SubmissionLink) => link.expired;

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
    <h1 className="libre-font text-3xl text-(--positive-tertiary)">Submission links</h1>
    <p className="mt-2 max-w-3xl text-sm text-foreground/65">
      Create a link for a vendor to add their own listing, then send it to them yourself. Their listing goes to the review queue on the
      Vendors page and stays hidden from customers until you approve it. Links work for {SUBMISSION_LINK.lifetimeDays} days and stop working once the vendor submits.
    </p>

    <form onSubmit={create} className="mt-6 flex flex-col gap-4 rounded-2xl border border-(--tertiary) bg-white p-5">
      <h2 className="font-medium">New link</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-60 flex-1 flex-col gap-1 text-xs">Vendor name
          <input required value={label} maxLength={SUBMISSION_LINK.labelMax} onChange={(event) => setLabel(event.target.value)}
            className="rounded-lg border border-(--tertiary) bg-white p-2 text-sm" placeholder="For example: Dewan Seri Kenanga" />
        </label>
        <label className="flex min-w-60 flex-1 flex-col gap-1 text-xs">Vendor email (optional, for sending by email later)
          <input type="email" value={email} maxLength={SUBMISSION_LINK.emailMax} onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg border border-(--tertiary) bg-white p-2 text-sm" />
        </label>
        <MainButton type="submit" size="small" disabled={busy || !label.trim()}>{busy && !cancelling ? "Creating…" : "Create link"}</MainButton>
      </div>
      {error && !cancelling && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </form>

    {created && <section role="status" className="mt-5 flex flex-col gap-3 rounded-2xl border border-(--positive-secondary) bg-(--positive)/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-medium">Link for {created.label} is ready</h2>
        <button type="button" className="text-xs underline" onClick={() => setCreated(null)}>Done</button>
      </div>
      <p className="text-xs text-foreground/65">Copy it now and send it to the vendor (for example on WhatsApp). For security the full link is shown only once; if it&apos;s lost, cancel it and create a new one.</p>
      <CopyBox label="Link" value={created.url} />
      <CopyBox label="Message to send" value={created.message.body} multiline />
    </section>}

    <h2 className="mt-8 font-medium">Recent links</h2>
    {!links ? (loadError ? <p role="alert" className="py-6 text-sm">Links could not be loaded.</p> : <LoadingScreen label="Loading links…" backdrop={false} />) : <>
      <ul className="mt-3 divide-y divide-(--tertiary) overflow-hidden rounded-xl border border-(--tertiary) bg-white">
        {links.map((link) => <li key={link.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 break-words font-medium">{link.label}
              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-normal ${STATE_STYLES[link.state]}`}>
                {expired(link) ? "Expired" : SUBMISSION_LINK_STATE_LABELS[link.state]}
              </span>
            </p>
            <p className="mt-1 text-xs text-foreground/60">
              Created {day(link.createdAt)}
              {(link.state === "open" || link.state === "reopened") && ` · ${expired(link) ? "expired" : "works until"} ${day(link.expiresAt)}`}
              {link.submittedAt && ` · submitted ${day(link.submittedAt)}`}
              {link.vendorEmail && ` · ${link.vendorEmail}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {link.vendorId !== null && <MainButton size="small" variant="secondary" href={adminVendorRoute(link.vendorId)}>
              {link.state === "submitted" ? "Review" : "Open listing"}
            </MainButton>}
            {(link.state === "open" || link.state === "reopened") && !expired(link) &&
              <MainButton size="small" variant="ghost" onClick={() => { setError(""); setCancelling(link); }}>Cancel link</MainButton>}
          </div>
        </li>)}
        {!links.length && <li className="p-5 text-sm">No links yet.</li>}
      </ul>
    </>}

    <CustomDialog open={cancelling !== null} onClose={() => setCancelling(null)} onConfirm={cancel} busy={busy} title="Cancel link">
      <p className="text-sm">{cancelling?.state === "reopened"
        ? `The link sent to ${cancelling.label} for changes stops working. Their listing stays in the review queue as they last submitted it.`
        : `The link for ${cancelling?.label} stops working. The vendor will see that it was cancelled if they open it.`}</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </CustomDialog>
  </main>;
}
