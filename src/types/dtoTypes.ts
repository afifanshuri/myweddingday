import type { findVendorsByPreferences } from "@/db/queries/vendors";

type PakcageDTOType = {
  name: string;
  price: number;
  details: string | null;
  vendorId: number | null;
  filePath?: string;
  vendorName: string;
  filters: Record<string, any>;
  tags: string[];
};

type VendorMatchDTOType = {
  serviceId: number;
  location: number[];
  budget: number;
  criteria: Record<string, any>;
  requiredFields?: string[];
};

type VendorAndPackagesMatchDTOType =
  Awaited<ReturnType<typeof findVendorsByPreferences>>[number];

export type {
  PakcageDTOType,
  VendorMatchDTOType,
  VendorAndPackagesMatchDTOType,
};
