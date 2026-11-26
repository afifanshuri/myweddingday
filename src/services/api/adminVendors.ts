import type { CriteriaValues } from "@/config/serviceCriteria";
import type { VendorStatus } from "@/config/vendorStatus";
import type { SubmissionLinkState } from "@/config/submissionLinks";
import type { AttachmentKind } from "@/config/uploads";
import type { VendorSaveBody } from "./vendors";

export type AdminVendorListItem = { id: number; vendorName: string; serviceId: number; serviceName: string; createdAt: string;
  locationCount: number; packageCount: number; status: VendorStatus };
export type VendorReview = { status: VendorStatus; note: string | null; reviewedAt: string | null };
/** A message for the admin to copy and send to the vendor (later: sent by email). */
export type VendorMessage = { subject: string; body: string };
export type VendorSubmission = { id: number; state: SubmissionLinkState; label: string; vendorEmail: string | null; fixNote: string | null;
  expiresAt: string; submittedAt: string | null };
export type SubmissionLink = { id: number; label: string; vendorEmail: string | null; state: SubmissionLinkState; createdAt: string;
  expiresAt: string; submittedAt: string | null; vendorId: number | null; vendorName: string | null; expired: boolean };
export type AdminVendorList = { vendors: AdminVendorListItem[]; page: number; total: number; pendingCount: number; pageCount: number };
export type AdminVendorDetail = {
  vendor: { id: number; vendorName: string; serviceId: number; locationId: number[]; contact: string | null; detail: string | null;
    instagram: string | null; facebook: string | null; tiktok: string | null };
  review: VendorReview;
  submission: VendorSubmission | null;
  images: { path: string; url: string | null }[];
  packages: { id: number; name: string; price: number; details: string; filters: CriteriaValues;
    attachments: { path: string; name: string; kind: AttachmentKind; size: number | null; url: string | null }[] }[];
};

async function read<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? fallback);
  return data as T;
}

export async function APIListAdminVendors(params: { q: string; serviceId: number | null; status: VendorStatus | null; page: number }, signal?: AbortSignal) {
  const search = new URLSearchParams({ page: String(params.page) });
  if (params.q) search.set("q", params.q);
  if (params.serviceId !== null) search.set("serviceId", String(params.serviceId));
  if (params.status !== null) search.set("status", params.status);
  return read<AdminVendorList>(await fetch(`/api/admin/vendors?${search}`, { cache: "no-store", signal }), "Unable to list vendors");
}

export async function APIGetAdminVendor(id: number, signal?: AbortSignal) {
  return read<AdminVendorDetail>(await fetch(`/api/admin/vendors/${id}`, { cache: "no-store", signal }), "Unable to load vendor");
}

export async function APIUpdateAdminVendor(id: number, body: VendorSaveBody) {
  return read<{ id: number }>(await fetch(`/api/admin/vendors/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body) }), "Unable to update vendor");
}

export async function APIDeleteAdminVendor(id: number) {
  return read<{ deleted: true }>(await fetch(`/api/admin/vendors/${id}`, { method: "DELETE" }), "Unable to delete vendor");
}

export async function APIReviewAdminVendor(id: number, status: "approved" | "rejected", note: string) {
  return read<{ review: VendorReview; message: VendorMessage | null }>(await fetch(`/api/admin/vendors/${id}/review`, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, note }) }), "Unable to review vendor");
}

export async function APIRequestVendorFixes(id: number, note: string) {
  return read<{ review: VendorReview; submission: VendorSubmission; url: string; message: VendorMessage }>(await fetch(`/api/admin/vendors/${id}/request-fixes`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }) }), "Unable to request changes");
}

export async function APIListSubmissionLinks(signal?: AbortSignal) {
  return read<SubmissionLink[]>(await fetch("/api/admin/submission-links", { cache: "no-store", signal }), "Unable to list links");
}

export async function APICreateSubmissionLink(label: string, vendorEmail: string) {
  return read<{ link: SubmissionLink; url: string; message: VendorMessage }>(await fetch("/api/admin/submission-links", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label, vendorEmail }) }), "Unable to create link");
}

export async function APICancelSubmissionLink(id: number) {
  return read<SubmissionLink>(await fetch(`/api/admin/submission-links/${id}`, { method: "DELETE" }), "Unable to cancel link");
}
