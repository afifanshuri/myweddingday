import { VendorType } from "@/types/dataTypes";
import { VendorMatchDTOType } from "@/types/dtoTypes";
import type { ManualSearchResult } from "@/types/search";

const APIGetVendorsByServiceIds = async (
  serviceId: number[],
): Promise<VendorType[]> => {
  return await fetch(`api/vendors?serviceIds=${serviceId.join(",")}`).then(
    (response) => response.json(),
  );
};

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

export { APIGetVendorsByServiceIds, APIGetVendorsByPreferences };

export async function APICreateVendorWithPackages(
  formData: FormData,
): Promise<{ id: number; vendorName: string }> {
  const response = await fetch("/api/vendors", {
    method: "POST",
    body: formData,
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
