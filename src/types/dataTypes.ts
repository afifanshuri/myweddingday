import type { UploadItem } from "@/services/api/uploads";
import type { CriteriaValues } from "@/config/serviceCriteria";
type WeddingDetailType = {
  locations: number[];
  date: string | null;
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
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  rating: number | null;
};

type PackageType = {
  id: number;
  name: string;
  price: number;
  details: string | null;
  vendorId: number | null;
  tags: string[];
  filters: CriteriaValues;
  /** Price lists, service details, anything: saved files and new uploads. */
  attachments: UploadItem[];
  /** Set when editing: the saved package's database id. */
  recordId?: number;
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
  WeddingDetailsFormErrors,
  VendorType,
  ServiceType,
  PackageType,
  LocationType,
  ClassnameType,
};
