import { VENDOR_STATUS_LABELS, type VendorStatus } from "@/config/vendorStatus";

const STYLES: Record<VendorStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  approved: "border-(--positive-secondary) bg-(--positive)/20 text-(--positive-tertiary)",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

/** The status as a small tag; a rejected listing can carry its reason ("Rejected: photos are missing"). */
export default function VendorStatusBadge({ status, reason }: { status: VendorStatus; reason?: string | null }) {
  const withReason = status === "rejected" && reason?.trim();
  return <span className={`inline-flex max-w-full rounded-full border px-2.5 py-0.5 text-xs font-normal ${withReason ? "whitespace-pre-line break-words rounded-xl" : ""} ${STYLES[status]}`}>
    {VENDOR_STATUS_LABELS[status]}{withReason ? `: ${reason!.trim()}` : ""}
  </span>;
}
