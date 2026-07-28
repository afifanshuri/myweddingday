type WeddingDetailType = {
  locations: number[];
  date: Date | null;
  coupleName: string;
  pax: number;
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
  locationId: number[];
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
  WeddingDetailType,
  VendorType,
  ServiceType,
  PackageType,
  LocationType,
  ClassnameType,
};
