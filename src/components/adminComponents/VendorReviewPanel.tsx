"use client";

import { useState } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import CustomDialog from "@/components/commonComponents/CustomDialog";
import { APIRequestVendorFixes, APIReviewAdminVendor, type VendorMessage, type VendorReview, type VendorSubmission } from "@/services/api/adminVendors";
import { REVIEW_NOTE_MAX } from "@/config/vendorStatus";
import { SUBMISSION_LINK } from "@/config/submissionLinks";
import VendorStatusBadge from "./VendorStatusBadge";
import CopyBox from "./CopyBox";

const EXPLAIN: Record<VendorReview["status"], string> = {
  pending: "This listing is waiting for review. Customers don't see it until you approve it.",
  approved: "Customers can find this vendor in their results.",
  rejected: "Customers don't see this vendor. Approve it to list it again.",
};

const when = (value: string) => new Date(value).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" });

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
  });

  const requestFixes = () => run(async () => {
    const result = await APIRequestVendorFixes(vendorId, note);
    onSubmissionChange(result.submission);
    setToSend({ title: "Send the vendor what to change", url: result.url, message: result.message });
  });

  const canAskForFixes = review.status === "pending" && submission !== null && (submission.state === "submitted" || submission.state === "reopened");
  const openDialog = (kind: "reject" | "fix") => { setError(null); setNote(kind === "fix" && submission?.state === "reopened" ? submission.fixNote ?? "" : ""); setDialog(kind); };

  return <section aria-labelledby="review-heading" className="mb-6 rounded-3xl border border-(--tertiary) bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 id="review-heading" className="libre-font flex flex-wrap items-center gap-3 text-xl">Listing status <VendorStatusBadge status={review.status} /></h2>
        <p className="mt-2 text-sm text-foreground/65">{EXPLAIN[review.status]}</p>
        {review.reviewedAt && <p className="mt-1 text-xs text-foreground/50">Last reviewed {when(review.reviewedAt)} (Malaysia time)</p>}
        {review.status === "rejected" && review.note && <p className="mt-3 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><span className="font-medium">Reason:</span> {review.note}</p>}
        {submission && <div className="mt-3 text-xs text-foreground/60">
          <p>Submitted by the vendor from a link{submission.submittedAt ? ` on ${when(submission.submittedAt)}` : ""}{submission.vendorEmail ? ` · ${submission.vendorEmail}` : ""}.</p>
          {submission.state === "reopened" && <p className="mt-2 whitespace-pre-line rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <span className="font-medium">Waiting for the vendor&apos;s changes</span> (link works until {when(submission.expiresAt)}):{"\n"}{submission.fixNote}
          </p>}
        </div>}
      </div>
      <div className="flex flex-wrap gap-2">
        {review.status !== "approved" && <MainButton size="small" disabled={busy || disabled} onClick={() => review_("approved")}>{busy && !dialog ? "Approving…" : "Approve"}</MainButton>}
        {canAskForFixes && <MainButton size="small" variant="secondary" disabled={busy || disabled} onClick={() => openDialog("fix")}>
          {submission.state === "reopened" ? "Change request / new link" : "Ask for changes"}
        </MainButton>}
        {review.status !== "rejected" && <MainButton size="small" variant="danger" disabled={busy || disabled} onClick={() => openDialog("reject")}>Reject</MainButton>}
      </div>
    </div>
    {error && !dialog && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {toSend && <div role="status" className="mt-5 flex flex-col gap-3 rounded-2xl border border-(--positive-secondary) bg-(--positive)/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{toSend.title}</p>
        <button type="button" className="text-xs underline" onClick={() => setToSend(null)}>Done</button>
      </div>
      <p className="text-xs text-foreground/60">Copy this and send it to the vendor yourself (for example on WhatsApp or by email).{toSend.url ? " The previous link no longer works." : ""}</p>
      {toSend.url && <CopyBox label="Link" value={toSend.url} />}
      <CopyBox label="Message" value={toSend.message.body} multiline />
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
