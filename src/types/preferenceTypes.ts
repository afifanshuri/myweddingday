import type { CriteriaValues } from "@/config/serviceCriteria";
type BasicPreferenceType = {
  serviceId: number;
  budget: number;
  description: string;
  criteria: CriteriaValues;
  requiredFields?: string[];
};

type SelectedPackage = {
  serviceId: number;
  serviceName: string;
  vendorId: number;
  vendorName: string;
  packageId: number;
  packageName: string;
  unitPrice: number;
};

export type { BasicPreferenceType, SelectedPackage };
