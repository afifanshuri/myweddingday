import { SERVICE_CRITERIA, hasCriteriaValue, isCriteriaVisible } from "@/config/serviceCriteria";
import type { VendorMatchDTOType } from "@/types/dtoTypes";

export class RequestError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestError("Expected an object");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new RequestError(`${label} is required and must be at most ${max} characters`);
  }
  return value.trim();
}

export function positiveId(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0 || value > 2147483647) {
    throw new RequestError("Invalid ID");
  }
  return value;
}

function serviceId(value: unknown): number {
  const id = positiveId(value);
  if (!Object.hasOwn(SERVICE_CRITERIA, id)) throw new RequestError("Invalid service");
  return id;
}

function ids(value: unknown): number[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    throw new RequestError("Select between 1 and 100 locations");
  }
  return [...new Set(value.map(positiveId))];
}

function money(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 1e9) {
    throw new RequestError("Price/budget must be a positive finite number below 1 billion");
  }
  return value;
}

function socialUrl(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  const url = text(value, "Social media URL", 200);
  try {
    if (!["https:", "http:"].includes(new URL(url).protocol)) throw new Error();
  } catch { throw new RequestError("Social media links must be valid HTTP/HTTPS URLs"); }
  return url;
}

export function validateCriteria(value: unknown, id: number, audience: "admin" | "user") {
  const values = object(value ?? {});
  const fields = SERVICE_CRITERIA[id] ?? [];
  for (const [key, actual] of Object.entries(values)) {
    const field = fields.find((candidate) => candidate.key === key);
    if (!field || (field.user_mode && field.user_mode !== audience)) {
      throw new RequestError(`Invalid criterion: ${key}`);
    }
    if (!hasCriteriaValue(actual)) continue;
    let valid = false;
    switch (field.type) {
      case "boolean": valid = typeof actual === "boolean"; break;
      case "number":
        valid = typeof actual === "number" && Number.isFinite(actual)
          && actual >= (field.min ?? 0) && actual <= (field.max ?? 1e9)
          && (!field.step || Math.abs((actual - (field.min ?? 0)) / field.step
            - Math.round((actual - (field.min ?? 0)) / field.step)) < 1e-8);
        break;
      case "single-select": valid = typeof actual === "string" && !!field.options?.includes(actual); break;
      case "multi-select":
        valid = Array.isArray(actual) && actual.length <= (field.options?.length ?? 0)
          && actual.every((option) => typeof option === "string" && field.options?.includes(option));
        break;
      case "text": valid = typeof actual === "string" && actual.length <= 1000; break;
      case "date":
        valid = typeof actual === "string" && /^\d{4}-\d{2}-\d{2}$/.test(actual)
          && Number.isFinite(Date.parse(actual)) && new Date(actual).toISOString().slice(0, 10) === actual;
        break;
      case "time": valid = typeof actual === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(actual); break;
    }
    if (!valid) throw new RequestError(`Invalid value for ${field.label}`);
  }
  return Object.fromEntries(Object.entries(values).filter(([key, actual]) => {
    const field = fields.find((candidate) => candidate.key === key)!;
    return hasCriteriaValue(actual) && isCriteriaVisible(field, values, fields, audience);
  }));
}

export function validateVendor(value: unknown) {
  const vendor = object(value);
  if (Object.hasOwn(vendor, "rating")) throw new RequestError("Rating cannot be supplied when creating a vendor");
  const name = text(vendor.vendorName, "Vendor name", 255);
  if (name === "<Vendor Name>") throw new RequestError("Vendor name is required");
  return {
    vendorName: name,
    serviceId: serviceId(vendor.serviceId),
    locationId: ids(vendor.locationId),
    contact: text(vendor.contact, "Contact", 11),
    detail: text(vendor.detail, "Description", 500),
    instagram: socialUrl(vendor.instagram),
    facebook: socialUrl(vendor.facebook),
    tiktok: socialUrl(vendor.tiktok),
  };
}

export function validatePackages(value: unknown, id: number) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) {
    throw new RequestError("Provide between 1 and 20 packages");
  }
  return value.map((entry) => {
    const pkg = object(entry);
    return {
      packageName: text(pkg.name, "Package name", 255),
      price: money(pkg.price),
      details: text(pkg.details, "Package description", 1000),
      filters: validateCriteria(pkg.filters, id, "admin"),
    };
  });
}

export function validatePreferences(value: unknown): VendorMatchDTOType[] {
  console.log("in validatePreferences");
  if (!Array.isArray(value) || value.length > 6) throw new RequestError("Invalid preferences list");
  const seen = new Set<number>();
  return value.map((entry) => {
    const preference = object(entry);
    const id = serviceId(preference.serviceId);
    if (seen.has(id)) throw new RequestError("Duplicate service preference");
    seen.add(id);
    const criteria = validateCriteria(preference.criteria, id, "user");
    const required = preference.requiredFields ?? [];
    if (!Array.isArray(required) || required.length > Object.keys(criteria).length
      || required.some((key) => typeof key !== "string" || !Object.hasOwn(criteria, key))) {
      throw new RequestError("Required fields must refer to active criteria with values");
    }
    return { serviceId: id, location: ids(preference.location), budget: money(preference.budget),
      criteria, requiredFields: [...new Set(required)] as string[] };
  });
}

// Bound the stream before parsing, including requests without Content-Length.
export async function readBody(request: Request, maxBytes: number): Promise<Response> {
  console.log("in readbody");
  if (Number(request.headers.get("content-length")) > maxBytes) throw new RequestError("Request is too large", 413);
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          await reader.cancel();
          throw new RequestError("Request is too large", 413);
        }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new Response(bytes, { headers: request.headers });
}

export function parseJson(value: string): unknown {
  try { return JSON.parse(value); }
  catch { throw new RequestError("Invalid JSON"); }
}

export function errorResponse(error: unknown, message: string): Response {
  if (error instanceof RequestError) return Response.json({ error: error.message }, { status: error.status });
  // Do not log raw database errors: they can include connection details or submitted data.
  console.error(message);
  return Response.json({ error: message }, { status: 500 });
}
