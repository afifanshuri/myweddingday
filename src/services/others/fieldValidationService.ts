import { WeddingDetailType } from "@/types/dataTypes";
import { WeddingFormErrors } from "@/types/errorTypes";

/** Returns the errors for the wedding details form; an empty object means the form is valid. */
const validateWeddingDetails = (weddingDetails: WeddingDetailType): WeddingFormErrors => {
  const errors: WeddingFormErrors = {};
  if (!weddingDetails.coupleName.trim()) errors.coupleName = "Couple name is required";
  if (!weddingDetails.date) errors.date = "Date is required";
  if (weddingDetails.pax === 0) errors.pax = "Number of guests is required";
  if (weddingDetails.locations.length === 0) errors.locations = "Location is required";
  if (weddingDetails.services.length === 0) errors.services = "Please select at least one service";
  return errors;
};

export { validateWeddingDetails };
