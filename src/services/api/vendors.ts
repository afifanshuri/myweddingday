import { VendorMatchDTOType } from "@/types/dtoTypes";
import type { ManualSearchResult } from "@/types/search";

const APIGetVendorsByPreferences = async (
  preferencesList: VendorMatchDTOType[],
  searchId: string,
  signal?: AbortSignal,
): Promise<ManualSearchResult> => {
  const response = await fetch("/api/match/vendors", {
    method: "POST",
    cache: "no-store",
    signal,
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": searchId,
    },
    body: JSON.stringify(preferencesList),
  });
  const data = await response.json();
  if (!response.ok) throw new SearchRequestError(data.error ?? "Unable to load vendor matches", response.status);
  return data;
};

export { APIGetVendorsByPreferences };

/** The vendor form's save body: details plus file references (saved paths or upload ids). */
export type VendorSaveBody = { vendor: Record<string, unknown>; images: ({ path: string } | { upload: string })[];
  packages: Record<string, unknown>[] };

export async function APICreateVendorWithPackages(body: VendorSaveBody): Promise<{ id: number }> {
  const response = await fetch("/api/vendors", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Unable to save vendor");
  return data;
}

export class SearchRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function APIGetSavedSearch(searchId: string, page = 1, signal?: AbortSignal, serviceId: number | null = null): Promise<ManualSearchResult> {
  const response = await fetch(`/api/match/vendors?searchId=${encodeURIComponent(searchId)}&page=${page}${serviceId === null ? "" : `&serviceId=${serviceId}`}`, { cache: "no-store", signal });
  const data = await response.json();
  if (!response.ok) throw new SearchRequestError(data.error ?? "Unable to load saved results", response.status);
  return data;
}

export async function APIGetSearchVendor(searchId: string, vendorId: number, signal?: AbortSignal): Promise<import("@/types/dtoTypes").VendorDetailedMatch> {
  const response = await fetch(`/api/match/vendors?searchId=${encodeURIComponent(searchId)}&vendorId=${vendorId}`, { cache: "no-store", signal });
  const data = await response.json();
  if (!response.ok) throw new SearchRequestError(data.error ?? "Unable to load vendor details", response.status);
  return data;
}
