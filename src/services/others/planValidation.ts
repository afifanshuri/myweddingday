import { SERVICE_CRITERIA } from "@/config/serviceCriteria";
import { WEDDING_PLAN, type SavedPlan } from "@/config/weddingPlan";
import { RequestError, object, validateCriteria } from "./requestValidation";

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isId = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 2147483647;
const isService = (value: unknown): value is number => isId(value) && Object.hasOwn(SERVICE_CRITERIA, value);
const string = (value: unknown, max: number) => typeof value === "string" ? value.slice(0, max) : "";
const list = (value: unknown) => Array.isArray(value) ? value : [];
const unique = <T,>(values: T[]) => [...new Set(values)];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

function amount(value: unknown, max: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0;
}

/** Keeps only criteria values that are valid for the service, then drops any the remaining answers hide. */
function criteria(value: unknown, serviceId: number) {
  if (!isRecord(value)) return {};
  const valid = Object.fromEntries(Object.entries(value).filter(([key, actual]) => {
    try { validateCriteria({ [key]: actual }, serviceId, "user"); return true; } catch { return false; }
  }));
  return validateCriteria(valid, serviceId, "user");
}

/**
 * Cleans a plan sent by the browser before saving it. A draft is allowed to be incomplete, so instead of rejecting
 * the whole plan over one odd value (which would stop it saving at all), values that don't fit are dropped or clamped.
 * Only a body that isn't a plan at all is refused.
 */
export function normalizePlan(value: unknown): SavedPlan {
  const plan = object(value);
  if (!isRecord(plan.weddingDetails)) throw new RequestError("Invalid plan");
  const details = plan.weddingDetails;
  const services = unique(list(details.services).filter(isService)).slice(0, 6);
  const names = isRecord(details.serviceNames) ? details.serviceNames : {};
  const pax = amount(details.pax, WEDDING_PLAN.maxPax);

  const seen = new Set<number>();
  const preferencesList = list(plan.preferencesList).filter(isRecord).flatMap((entry) => {
    const serviceId = entry.serviceId;
    if (!isService(serviceId) || seen.has(serviceId)) return [];
    seen.add(serviceId);
    const values = criteria(entry.criteria, serviceId);
    const required = unique(list(entry.requiredFields).filter((key): key is string => typeof key === "string" && Object.hasOwn(values, key)));
    return [{ serviceId, budget: amount(entry.budget, 1e9), description: string(entry.description, WEDDING_PLAN.descriptionMax),
      criteria: values, requiredFields: required }];
  }).slice(0, 6);

  const picked = new Set<number>();
  const selectedPackages = list(plan.selectedPackages).filter(isRecord).flatMap((entry) => {
    const { serviceId, vendorId, packageId, unitPrice } = entry;
    if (!isService(serviceId) || !services.includes(serviceId) || picked.has(serviceId) || !isId(vendorId) || !isId(packageId)
      || typeof unitPrice !== "number" || !Number.isFinite(unitPrice) || unitPrice <= 0 || unitPrice > 1e9) return [];
    picked.add(serviceId);
    return [{ serviceId, serviceName: string(entry.serviceName, WEDDING_PLAN.serviceNameMax), vendorId, vendorName: "", packageId, packageName: "", unitPrice }];
  });

  const listed = new Set<number>();
  const shortlist = list(plan.shortlist).filter(isRecord).flatMap((entry) => {
    const { vendorId, serviceId } = entry;
    if (!isId(vendorId) || !isService(serviceId) || listed.has(vendorId)) return [];
    listed.add(vendorId);
    return [{ vendorId, serviceId }];
  }).slice(0, WEDDING_PLAN.maxShortlist);

  const search = isRecord(plan.manualSearch) ? plan.manualSearch : null;
  const manualSearch = search && typeof search.id === "string" && UUID.test(search.id) && typeof search.input === "string"
    && search.input.length <= WEDDING_PLAN.maxSearchInput
    ? { id: search.id.toLowerCase(), input: search.input, pending: search.pending === true,
      ...(typeof search.createdAt === "number" && Number.isFinite(search.createdAt) && search.createdAt > 0 ? { createdAt: Math.floor(search.createdAt) } : {}) }
    : null;

  return {
    weddingDetails: {
      coupleName: string(details.coupleName, WEDDING_PLAN.coupleNameMax),
      date: validDate(details.date),
      locations: unique(list(details.locations).filter(isId)).slice(0, WEDDING_PLAN.maxLocations),
      pax: Math.floor(pax),
      services,
      serviceNames: Object.fromEntries(services.flatMap((id) => typeof names[id] === "string" ? [[id, string(names[id], WEDDING_PLAN.serviceNameMax)]] : [])),
    },
    preferencesList, selectedPackages, shortlist, manualSearch, manualSearchRequested: plan.manualSearchRequested === true,
  };
}
