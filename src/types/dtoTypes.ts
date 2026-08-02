import { PackageType, VendorType } from "./dataTypes";

type PakcageDTOType = {
  name: string;
  price: number;
  details: string | null;
  vendorId: number | null;
  filePath?: string;
  vendorName: string;
  embedding?: number[] | null;
  tags: string[];
};

type PreferenceDTOType = {
  serviceId: number;
  budget: number;
  description: string;
  embedding: number[] | null;
}

type VendorMatchDTOType = {
  serviceId: number;
  location: number[];
  budget: number;
  embedding: number[] | null;
}

type VendorAndPackagesMatchDTOType = {
  vendor: VendorType;
  packages: PackageType[];
};



export type { PakcageDTOType, VendorMatchDTOType, PreferenceDTOType, VendorAndPackagesMatchDTOType };
