import { PackageType } from "./dataTypes";

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

export type { PakcageDTOType };
