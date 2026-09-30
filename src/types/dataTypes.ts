type UserType = {
  id: number;
  createdAt: Date;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: "user" | "admin";
};

type WeddingDetailType = {
  locations: number[];
  date: Date | null;
  coupleName: string;
  pax: number;
  services: number[];
};

type WeddingDetailsFormErrors = {
  coupleName?: string;
  date?: string;
  pax?: string;
  locations?: string;
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
  filters: Record<string, any>;
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
  UserType,
  WeddingDetailType,
  WeddingDetailsFormErrors,
  VendorType,
  ServiceType,
  PackageType,
  LocationType,
  ClassnameType,
};
