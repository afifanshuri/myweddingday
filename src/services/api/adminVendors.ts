import type { CriteriaValues } from "@/config/serviceCriteria";
import type { VendorStatus } from "@/config/vendorStatus";

export type AdminVendorListItem = { id: number; vendorName: string; serviceId: number; serviceName: string; createdAt: string;
  locationCount: number; packageCount: number; status: VendorStatus };
export type VendorReview = { status: VendorStatus; note: string | null; reviewedAt: string | null };
export type AdminVendorList = { vendors: AdminVendorListItem[]; page: number; total: number; pendingCount: number; pageCount: number };
export type AdminVendorDetail = {
  vendor: { id: number; vendorName: string; serviceId: number; locationId: number[]; contact: string | null; detail: string | null;
    instagram: string | null; facebook: string | null; tiktok: string | null };
  review: VendorReview;
  images: { path: string; url: string | null }[];
  packages: { id: number; name: string; price: number; details: string; filters: CriteriaValues; imageUrl: string | null; hasImage: boolean }[];
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

export async function APIUpdateAdminVendor(id: number, formData: FormData) {
  return read<{ id: number }>(await fetch(`/api/admin/vendors/${id}`, { method: "PUT", body: formData }), "Unable to update vendor");
}

export async function APIDeleteAdminVendor(id: number) {
  return read<{ deleted: true }>(await fetch(`/api/admin/vendors/${id}`, { method: "DELETE" }), "Unable to delete vendor");
}

export async function APIReviewAdminVendor(id: number, status: "approved" | "rejected", note: string) {
  return read<VendorReview>(await fetch(`/api/admin/vendors/${id}/review`, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, note }) }), "Unable to review vendor");
}
