type BasicPreferenceType = {
  serviceId: number;
  budget: number;
  description: string;
  criteria: Record<string, any>;
  requiredFields?: string[];
};

export type { BasicPreferenceType };
