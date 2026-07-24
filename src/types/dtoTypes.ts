import { PackageType } from "./basicTypes";

type PakcageDTOType = {
  name: string;
  price: number;
  details: string | null;
  vendorId: number | null;
  filePath?: string;
  vendorName: string;
  embedding?: number[];
  tags: string[];
};

export type { PakcageDTOType };
