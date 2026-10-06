import { PackageType, VendorType, WeddingDetailType } from "@/types/dataTypes";
import {
  PackageFormErrors,
  VendorFormErrors,
  WeddingFormErrors,
} from "@/types/errorTypes";

const validateWeddingDetails = (
  weddingDetails: WeddingDetailType,
  existingErrors?: WeddingFormErrors,
): WeddingFormErrors => {
  const errors: WeddingFormErrors = {};
  if (!weddingDetails.coupleName.trim()) {
    errors.coupleName = "Couple name is required";
  } else {
    existingErrors?.coupleName && delete existingErrors.coupleName;
  }

  if (!weddingDetails.date) {
    errors.date = "Date is required";
  } else {
    existingErrors?.date && delete existingErrors.coupleName;
  }

  if (weddingDetails.pax === 0) {
    errors.pax = "Number of guests is required";
  } else {
    existingErrors?.pax && delete existingErrors.pax;
  }
  if (weddingDetails.locations.length === 0) {
    errors.locations = "Location is required";
  } else {
    errors?.locations && delete existingErrors?.locations;
  }

  if (weddingDetails.services.length === 0) {
    errors.services = "Please select at least one service";
  } else {
    errors?.services && delete existingErrors?.services;
  }

  return errors;
};

const validateServiceSelection = (selectedServices: number[]): boolean => {
  return selectedServices.length > 0;
};

const validateVendorDetails = (vendorDetails: VendorType): boolean => {
  const errors: VendorFormErrors = {};
  if (!vendorDetails.vendorName.trim()) {
    errors.vendorName = "Vendor name is required";
  }
  if (!vendorDetails.serviceId) {
    errors.serviceId = "Service is required";
  }
  if (vendorDetails.locationId.length === 0) {
    errors.locationId = "Location is required";
  }
  if (!vendorDetails.detail?.trim()) {
    errors.detail = "Vendor details are required";
  }
  return Object.keys(errors).length === 0;
};

const validatePackageDetails = (packageDetails: PackageType): boolean => {
  const errors: PackageFormErrors = {};
  if (!packageDetails.name.trim()) {
    errors.name = "Package name is required";
  }
  if (!packageDetails.price) {
    errors.price = "Package price is required";
  }
  return Object.keys(errors).length === 0;
};

export {
  validateWeddingDetails,
  validateVendorDetails,
  validatePackageDetails,
};
