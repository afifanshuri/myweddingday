type WeddingFormErrors = {
  coupleName?: string;
  date?: string;
  pax?: string;
  locations?: string;
  services?: string;
};

type VendorFormErrors = {
  vendorName?: string;
  serviceId?: string;
  locationId?: string;
  detail?: string;
  contact?: string;
  rating?: string;
};

type PackageFormErrors = {
  name?: string;
  price?: string;
  details?: string;
};

export type { WeddingFormErrors, VendorFormErrors, PackageFormErrors };
