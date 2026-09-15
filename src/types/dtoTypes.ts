import { PackageType, VendorType } from "./dataTypes";

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
};

type VendorAndPackagesMatchDTOType = {
  vendor: VendorType;
  packages: PackageType[];
};

export type {
  PakcageDTOType,
  VendorMatchDTOType,
  VendorAndPackagesMatchDTOType,
};
