import { WeddingDetailType } from "@/types/dataTypes";
import { WeddingFormErrors } from "@/types/errorTypes";

type ErrorMessages = Record<"coupleName" | "date" | "pax" | "locations" | "services", string>;

/** Returns the errors for the wedding details form; an empty object means the form is valid. */
const validateWeddingDetails = (weddingDetails: WeddingDetailType, messages: ErrorMessages): WeddingFormErrors => {
  const errors: WeddingFormErrors = {};
  if (!weddingDetails.coupleName.trim()) errors.coupleName = messages.coupleName;
  if (!weddingDetails.date) errors.date = messages.date;
  if (weddingDetails.pax === 0) errors.pax = messages.pax;
  if (weddingDetails.locations.length === 0) errors.locations = messages.locations;
  if (weddingDetails.services.length === 0) errors.services = messages.services;
  return errors;
};

export { validateWeddingDetails };
