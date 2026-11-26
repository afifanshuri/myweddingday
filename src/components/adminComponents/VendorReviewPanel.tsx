"use client";

import { useState } from "react";
import { FiCheck, FiCheckCircle, FiCopy, FiEye, FiEyeOff, FiClock, FiLink, FiMail, FiMessageCircle, FiPenTool, FiSend, FiX } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import MainButton from "@/components/commonComponents/MainButton";
import CustomDialog from "@/components/commonComponents/CustomDialog";
import { APIRequestVendorFixes, APIReviewAdminVendor, type VendorMessage, type VendorReview, type VendorSubmission } from "@/services/api/adminVendors";
import { REVIEW_NOTE_MAX } from "@/config/vendorStatus";
import { SUBMISSION_LINK } from "@/config/submissionLinks";
import VendorStatusBadge from "./VendorStatusBadge";

const when = (value: string) => new Date(value).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" });
const shortDate = (value: string) => new Date(value).toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric", month: "short" });
const sendButton = "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary)";

/** Shows a vendor's listing status and lets an admin approve, reject, or (for vendor submissions) ask for changes. */
export default function VendorReviewPanel({ vendorId, review, submission, onChange, onSubmissionChange, disabled }: {
  vendorId: number; review: VendorReview; submission: VendorSubmission | null;
  onChange: (review: VendorReview) => void; onSubmissionChange: (submission: VendorSubmission) => void; disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"reject" | "fix" | null>(null);
  const [note, setNote] = useState("");
  // What to send the vendor after the last action (shown until the next one).
  const [toSend, setToSend] = useState<{ title: string; url?: string; message: VendorMessage } | null>(null);
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState<"message" | "link" | null>(null);
  // If copying isn't allowed (no clipboard permission), show the message so it can be copied by hand.
  const copy = async (what: "message" | "link", text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(null), 2000); } catch { setPreview(true); }
  };

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      setDialog(null);
      setNote("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const review_ = (status: "approved" | "rejected") => run(async () => {
    const result = await APIReviewAdminVendor(vendorId, status, status === "rejected" ? note : "");
    onChange(result.review);
    setToSend(result.message ? { title: status === "approved" ? "Let the vendor know it's live" : "Let the vendor know", message: result.message } : null);
    setPreview(false);
  });

  const requestFixes = () => run(async () => {
    const result = await APIRequestVendorFixes(vendorId, note);
    onSubmissionChange(result.submission);
    onChange(result.review);
    setToSend({ title: "Send the vendor what to change", url: result.url, message: result.message });
    setPreview(false);
  });

  // Any listing that came from a vendor's link: waiting for review, or already approved or rejected (it goes back to review).
  const canAskForFixes = submission !== null && (submission.state === "submitted" || submission.state === "reopened" || submission.state === "closed");
  const openDialog = (kind: "reject" | "fix") => { setError(null); setNote(kind === "fix" && submission?.state === "reopened" ? submission.fixNote ?? "" : ""); setDialog(kind); };

  const waiting = submission?.state === "reopened";
  return <section aria-labelledby="review-heading" className="mb-6 rounded-3xl border border-(--tertiary) bg-white p-5 shadow-sm sm:p-6">
    {/* Status and the facts behind it, then the three decisions. */}
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        <h2 id="review-heading" className="libre-font flex min-w-0 flex-wrap items-center gap-3 text-xl text-(--positive-tertiary)">Vendor review <VendorStatusBadge status={review.status} reason={review.note} /></h2>
        {submission?.submittedAt && <span className="inline-flex items-center gap-1.5 text-xs text-foreground/55" title={`Submitted by the vendor from a link, ${when(submission.submittedAt)}`}>
          <FiSend aria-hidden="true" />Submitted {shortDate(submission.submittedAt)}</span>}
        {review.reviewedAt && <span className="inline-flex items-center gap-1.5 text-xs text-foreground/55" title={`Last reviewed ${when(review.reviewedAt)} (Malaysia time)`}>
          <FiCheckCircle aria-hidden="true" />Reviewed {shortDate(review.reviewedAt)}</span>}
        {submission?.vendorEmail && <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-foreground/55" title="Vendor's email">
          <FiMail aria-hidden="true" /><span className="truncate">{submission.vendorEmail}</span></span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {review.status !== "approved" && <MainButton size="small" disabled={busy || disabled} onClick={() => review_("approved")}>
          <FiCheck aria-hidden="true" />{busy && !dialog ? "Approving…" : "Approve"}</MainButton>}
        {canAskForFixes && <MainButton size="small" variant="secondary" disabled={busy || disabled} onClick={() => openDialog("fix")}
          aria-label={waiting ? "Ask for changes again (new link)" : "Ask for changes"} title={waiting ? "Change the request and send a new link" : "Ask the vendor for changes"}>
          <FiPenTool aria-hidden="true" />Changes</MainButton>}
        {review.status !== "rejected" && <MainButton size="small" variant="danger" className="border-red-300! hover:bg-red-50" disabled={busy || disabled} onClick={() => openDialog("reject")}>
          <FiX aria-hidden="true" />Reject</MainButton>}
      </div>
    </div>
    {error && !dialog && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}

    {/* What's going on with the vendor, and what to send them. */}
    {(waiting || toSend) && <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-3 border-t border-(--secondary) pt-4">
      {waiting ? <p className="flex min-w-0 flex-1 basis-60 items-center gap-2 text-sm text-foreground/75" title="Waiting for the vendor's changes">
        <FiClock aria-hidden="true" className="shrink-0 text-amber-700" /><span className="shrink-0 text-foreground/55">Changes requested:</span>
        <span className="min-w-0 truncate">“{submission.fixNote}”</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-foreground/55" title={`Link works until ${when(submission.expiresAt)}`}>
          <FiLink aria-hidden="true" />Link until {shortDate(submission.expiresAt)}</span>
      </p> : <p className="flex min-w-0 flex-1 basis-60 items-center gap-2 text-sm text-foreground/75"><FiMessageCircle aria-hidden="true" className="shrink-0" />{toSend!.title}</p>}
      {toSend && <div role="group" aria-label="Send to the vendor" className="flex flex-wrap items-center gap-2">
        <button type="button" aria-expanded={preview} onClick={() => setPreview(!preview)}
          className={`${sendButton} border-(--tertiary) bg-white text-(--positive-tertiary) hover:bg-(--secondary)`}>
          {preview ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}Preview message</button>
        <button type="button" onClick={() => copy("message", toSend.message.body)}
          className={`${sendButton} border-(--positive-tertiary) bg-(--positive-tertiary) text-white hover:bg-(--positive-tertiary)/90`}>
          {copied === "message" ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}{copied === "message" ? "Copied" : "Copy message"}</button>
        {toSend.url && <button type="button" onClick={() => copy("link", toSend.url!)}
          className={`${sendButton} border-(--tertiary) bg-white text-(--positive-tertiary) hover:bg-(--secondary)`}>
          {copied === "link" ? <FiCheck aria-hidden="true" /> : <FiLink aria-hidden="true" />}{copied === "link" ? "Copied" : "Copy link"}</button>}
        {/* Opens WhatsApp with the message filled in; the admin still picks the contact and sends it. */}
        <a href={`https://wa.me/?text=${encodeURIComponent(toSend.message.body)}`} target="_blank" rel="noopener noreferrer"
          className={`${sendButton} border-(--tertiary) bg-white text-[#1f8f4e] hover:bg-(--secondary)`}>
          <FaWhatsapp aria-hidden="true" />WhatsApp</a>
        <button type="button" aria-label="Done" title="Done" onClick={() => { setToSend(null); setPreview(false); }}
          className="grid size-9 place-items-center rounded-full text-foreground/50 hover:bg-(--secondary) focus-visible:outline-2 focus-visible:outline-(--positive-tertiary)">
          <FiX aria-hidden="true" /></button>
      </div>}
    </div>}
    {toSend && preview && <div className="mt-3 whitespace-pre-wrap wrap-break-word rounded-2xl bg-(--secondary) p-4 text-sm leading-6 text-foreground/85 sm:p-5">
      {toSend.message.body}
    </div>}

    <CustomDialog open={dialog === "reject"} onClose={() => setDialog(null)} onConfirm={() => review_("rejected")} busy={busy} title="Reject listing">
      <p className="text-sm">{review.status === "approved" ? "Customers will stop seeing this vendor in their results and budgets." : "The listing stays hidden from customers."} You can approve it later.</p>
      <label className="mt-4 flex flex-col gap-1 text-sm">Reason (optional)
        <textarea value={note} maxLength={REVIEW_NOTE_MAX} rows={4} onChange={(event) => setNote(event.target.value)}
          className="rounded-lg border border-(--tertiary) p-2 text-sm" placeholder="For example: photos are missing, or prices need checking" />
      </label>
      <p className="mt-1 text-right text-xs text-foreground/50">{note.length}/{REVIEW_NOTE_MAX}</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </CustomDialog>
    <CustomDialog open={dialog === "fix"} onClose={() => setDialog(null)} onConfirm={() => { if (note.trim()) requestFixes(); else setError("Write what the vendor should change."); }}
      busy={busy} title="Ask the vendor for changes">
      {review.status === "approved" && <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        This listing is live. It goes back to review and is hidden from customers until you approve it again. Couples who chose or
        shortlisted it see it as currently unavailable in the meantime.
      </p>}
      <p className="text-sm">You&apos;ll get a new link to send the vendor. It opens their listing as they submitted it, with your note at the top. The listing stays hidden until you approve it.{submission?.state === "reopened" ? " The link you sent before stops working." : ""}</p>
      <label className="mt-4 flex flex-col gap-1 text-sm">What should they change?
        <textarea value={note} maxLength={SUBMISSION_LINK.fixNoteMax} rows={5} onChange={(event) => setNote(event.target.value)}
          className="rounded-lg border border-(--tertiary) p-2 text-sm" placeholder="For example: please add photos of the hall, and check the price of the Gold package" />
      </label>
      <p className="mt-1 text-right text-xs text-foreground/50">{note.length}/{SUBMISSION_LINK.fixNoteMax}</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </CustomDialog>
  </section>;
}
