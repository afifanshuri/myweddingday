import type { CriteriaValues } from "@/config/serviceCriteria";
import type { findVendorsByPreferences } from "@/db/queries/vendors";
import type { AttachmentView } from "@/config/uploads";

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

type StoredMatch = Awaited<ReturnType<typeof findVendorsByPreferences>>[number];
/** A vendor with its matched packages as sent to customers: attachments carry short-lived links, never storage paths. */
type VendorAndPackagesMatchDTOType = Omit<StoredMatch, "packages"> & {
  packages: (Omit<StoredMatch["packages"][number], "attachments"> & { attachments: AttachmentView[] })[];
};

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
