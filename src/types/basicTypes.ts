type WeddingType = {
  id: number;
  location: "KL" | "Selangor";
  budget: number;
  pax: number;
  services: string[];
  prompt: string;
};

type VendorType = {
  id: number;
  createdAt: Date;
  vendorName: string;
  serviceId: number;
  locationId: number;
  detail: string | null;
  contact: number | null;
};

type PackageType = {
  id: number;
  name: string;
  price: number;
  image: string;
  details: string;
  vendorId: number;
};

type ServiceType = {
  id: number;
  createdAt: Date;
  serviceName: string;
};

type ClassnameType = {
  className?: string;
};

export type {
  WeddingType,
  VendorType,
  ServiceType,
  PackageType,
  ClassnameType,
};
