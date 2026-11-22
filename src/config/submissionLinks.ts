/**
 * Vendor submission links: an admin creates a link, the vendor fills in the vendor form from it without signing in,
 * and the listing goes to the review queue as pending.
 *
 * - open: created, waiting for the vendor's first submission
 * - submitted: the vendor submitted; the link no longer works
 * - reopened: an admin asked for fixes; a new link works again for the same submission
 * - closed: the listing was approved or rejected; the link never works again
 * - cancelled: an admin cancelled it before the vendor submitted
 */
export const SUBMISSION_LINK_STATES = ["open", "submitted", "reopened", "closed", "cancelled"] as const;
export type SubmissionLinkState = (typeof SUBMISSION_LINK_STATES)[number];

export const SUBMISSION_LINK = {
  lifetimeDays: 14,
  labelMax: 255,
  emailMax: 255,
  fixNoteMax: 1000,
  /** Submissions (successful or not) allowed per link and per IP address, per hour. */
  submitsPerLinkPerHour: 10,
  submitsPerIpPerHour: 20,
  /** Form loads allowed per IP address, per hour. */
  viewsPerIpPerHour: 120,
  /** File uploads allowed per link and per IP address, per hour. */
  uploadsPerLinkPerHour: 200,
  uploadsPerIpPerHour: 300,
} as const;

export const SUBMISSION_LINK_STATE_LABELS: Record<SubmissionLinkState, string> = {
  open: "Waiting for vendor",
  submitted: "Submitted",
  reopened: "Fixes requested",
  closed: "Reviewed",
  cancelled: "Cancelled",
};

export const vendorSubmitRoute = (token: string) => `/vendor-submit/${token}`;
/** Tokens are 32 random bytes in base64url (43 characters). */
export const SUBMISSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
