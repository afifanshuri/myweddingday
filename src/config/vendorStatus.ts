/** Listing status. Customers only ever see `approved` vendors. */
export const VENDOR_STATUSES = ["pending", "approved", "rejected"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];
export const REVIEW_NOTE_MAX = 500;

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  pending: "Waiting for review",
  approved: "Approved",
  rejected: "Rejected",
};

export const isVendorStatus = (value: unknown): value is VendorStatus =>
  typeof value === "string" && (VENDOR_STATUSES as readonly string[]).includes(value);
