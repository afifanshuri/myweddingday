type BasicPreferenceType = {
  serviceId: number;
  budget: number;
  description: string;
  criteria: Record<string, any>;
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
