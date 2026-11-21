import type { CriteriaValues } from "@/config/serviceCriteria";
import type { findVendorsByPreferences } from "@/db/queries/vendors";

type PakcageDTOType = {
  name: string;
  price: number;
  details: string | null;
  vendorId: number | null;
  filePath?: string;
  vendorName: string;
  filters: CriteriaValues;
  tags: string[];
};

type VendorMatchDTOType = {
  serviceId: number;
  location: number[];
  budget: number;
  criteria: CriteriaValues;
  requiredFields?: string[];
};

type VendorAndPackagesMatchDTOType =
  Awaited<ReturnType<typeof findVendorsByPreferences>>[number];

export type VendorPreviewMatch = {
  identityLocked: true;
  vendor: Pick<VendorAndPackagesMatchDTOType["vendor"], "id" | "serviceId" | "rating" | "imageUrls">;
  cheapestPrice: number | null;
};
export type VendorDetailedMatch = VendorAndPackagesMatchDTOType & { identityLocked: false };
export type VendorMatchResult = VendorPreviewMatch | VendorDetailedMatch;

export type {
  PakcageDTOType,
  VendorMatchDTOType,
  VendorAndPackagesMatchDTOType,
};
