type BasicPreferenceType = {
  serviceId: number;
  budget: number;
  style: string[];
  styleOptions: string[];
  description: string;
  embedding: number[] | null;
};

export type {
  BasicPreferenceType,
};
