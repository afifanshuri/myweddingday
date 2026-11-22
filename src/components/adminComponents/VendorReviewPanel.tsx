"use client";

import { useState } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import CustomDialog from "@/components/commonComponents/CustomDialog";
import { APIReviewAdminVendor, type VendorReview } from "@/services/api/adminVendors";
import { REVIEW_NOTE_MAX } from "@/config/vendorStatus";
import VendorStatusBadge from "./VendorStatusBadge";

const EXPLAIN: Record<VendorReview["status"], string> = {
  pending: "This listing is waiting for review. Customers don't see it until you approve it.",
  approved: "Customers can find this vendor in their results.",
  rejected: "Customers don't see this vendor. Approve it to list it again.",
};

/** Shows a vendor's listing status and lets an admin approve or reject it. */
export default function VendorReviewPanel({ vendorId, review, onChange, disabled }: {
  vendorId: number; review: VendorReview; onChange: (review: VendorReview) => void; disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  async function submit(status: "approved" | "rejected") {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await APIReviewAdminVendor(vendorId, status, status === "rejected" ? note : ""));
      setRejecting(false);
      setNote("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to review vendor");
    } finally {
      setBusy(false);
    }
  }

  return <section aria-labelledby="review-heading" className="mb-6 rounded-3xl border border-(--tertiary) bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 id="review-heading" className="libre-font flex flex-wrap items-center gap-3 text-xl">Listing status <VendorStatusBadge status={review.status} /></h2>
        <p className="mt-2 text-sm text-foreground/65">{EXPLAIN[review.status]}</p>
        {review.reviewedAt && <p className="mt-1 text-xs text-foreground/50">Last reviewed {new Date(review.reviewedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })} (Malaysia time)</p>}
        {review.status === "rejected" && review.note && <p className="mt-3 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><span className="font-medium">Reason:</span> {review.note}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {review.status !== "approved" && <MainButton size="small" disabled={busy || disabled} onClick={() => submit("approved")}>{busy && !rejecting ? "Approving…" : "Approve"}</MainButton>}
        {review.status !== "rejected" && <MainButton size="small" variant="danger" disabled={busy || disabled} onClick={() => { setError(null); setRejecting(true); }}>Reject</MainButton>}
      </div>
    </div>
    {error && !rejecting && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <CustomDialog open={rejecting} onClose={() => setRejecting(false)} onConfirm={() => submit("rejected")} busy={busy} title="Reject listing">
      <p className="text-sm">{review.status === "approved" ? "Customers will stop seeing this vendor in their results and budgets." : "The listing stays hidden from customers."} You can approve it later.</p>
      <label className="mt-4 flex flex-col gap-1 text-sm">Reason (optional)
        <textarea value={note} maxLength={REVIEW_NOTE_MAX} rows={4} onChange={(event) => setNote(event.target.value)}
          className="rounded-lg border border-(--tertiary) p-2 text-sm" placeholder="For example: photos are missing, or prices need checking" />
      </label>
      <p className="mt-1 text-right text-xs text-foreground/50">{note.length}/{REVIEW_NOTE_MAX}</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </CustomDialog>
  </section>;
}
