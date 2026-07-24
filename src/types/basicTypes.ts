type WeddingType = {
  id: number;
  location: "KL" | "Selangor";
  budget: number;
  pax: number;
  services: string[];
  prompt: string;
};

type LocationType = {
  id: number;
  locationName: string;
};

type VendorType = {
  id: number;
  createdAt: Date;
  vendorName: string;
  serviceId: number;
  locationId: number;
  detail: string | null;
  contact: string | null;
  rating: number | null;
};

type PackageType = {
  id: number;
  name: string;
  price: number;
  file: File | null;
  details: string | null;
  vendorId: number | null;
  tags: string[];
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
  LocationType,
  ClassnameType,
};
