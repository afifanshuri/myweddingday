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

export type { PakcageDTOType };
