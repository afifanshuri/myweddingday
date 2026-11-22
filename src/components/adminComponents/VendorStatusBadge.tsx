import { VENDOR_STATUS_LABELS, type VendorStatus } from "@/config/vendorStatus";

const STYLES: Record<VendorStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  approved: "border-(--positive-secondary) bg-(--positive)/20 text-(--positive-tertiary)",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

export default function VendorStatusBadge({ status }: { status: VendorStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-normal ${STYLES[status]}`}>{VENDOR_STATUS_LABELS[status]}</span>;
}
