import { VENDOR_LOOKUP } from "@/config/plans";
import { RequestError } from "./requestValidation";

/** Trims and collapses whitespace; rejects queries that are too short, too long or contain control characters. */
export function normalizeLookupQuery(value: unknown): string {
  if (typeof value !== "string") throw new RequestError("Enter a vendor name to search");
  const query = value.trim().replace(/\s+/g, " ");
  if (/[\u0000-\u001f\u007f]/.test(query)) throw new RequestError("Search contains invalid characters");
  if (query.length < VENDOR_LOOKUP.minLength) throw new RequestError(`Enter at least ${VENDOR_LOOKUP.minLength} characters`);
  if (query.length > VENDOR_LOOKUP.maxLength) throw new RequestError(`Search must be at most ${VENDOR_LOOKUP.maxLength} characters`);
  return query;
}

/** Escapes LIKE wildcards so user input matches literally (used with ESCAPE '\'). */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}
