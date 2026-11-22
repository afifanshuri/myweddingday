import type { AdminVendorDetail, VendorMessage } from "./adminVendors";
import type { VendorSaveBody } from "./vendors";

/** The vendor's form: blank for a new link, or their saved listing (and the admin's note) when reopened for fixes. */
export type VendorSubmissionForm = {
  label: string; expiresAt: string; fixNote: string | null;
  saved: Pick<AdminVendorDetail, "vendor" | "images" | "packages"> | null;
};

export class LinkError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function read<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new LinkError(data.error ?? fallback, response.status);
  return data as T;
}

export async function APIReadVendorSubmission(token: string, signal?: AbortSignal) {
  return read<VendorSubmissionForm>(await fetch(`/api/vendor-submit/${encodeURIComponent(token)}`, { cache: "no-store", signal }), "Unable to open this link");
}

export async function APISubmitVendorListing(token: string, body: VendorSaveBody) {
  return read<{ message: VendorMessage }>(await fetch(`/api/vendor-submit/${encodeURIComponent(token)}`, { method: "POST",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    "Unable to submit your listing");
}
