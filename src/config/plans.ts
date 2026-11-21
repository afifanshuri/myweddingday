// Shared by pricing, preview projection, usage UI and server enforcement.
export const PLANS = {
  free: { manualSearchesPerDay: 3, vendorPreviews: null, aiTrialSearches: 1 },
  plus: { priceMYR: 20, durationYears: 1, manualSearchesPerDay: null, aiSearchesPerWeek: 5 },
  aiSearchEnabled: false,
  timeZone: "Asia/Kuala_Lumpur",
} as const;

export const SEARCH = {
  lifetimeMs: 24 * 60 * 60 * 1000,
  pageSize: 20,
  // Per-account limits. Action names are stored in search_request_limits.action (max 16 chars).
  requestsPerMinute: { create: 10, read: 60, detail: 30, selection: 30, lookup: 20 },
} as const;

// Paid vendor-name lookup. Results are capped and unpaginated, so bulk export
// requires many throttled queries rather than one request.
export const VENDOR_LOOKUP = { minLength: 2, maxLength: 60, maxResults: 10 } as const;

export function manualSearchLimit(access: { role: string | null; isPaid: boolean }) {
  return access.role === "admin" || access.isPaid ? null : PLANS.free.manualSearchesPerDay;
}

export function searchDay(now = new Date()) {
  // Malaysia uses UTC+8 without daylight-saving changes.
  const day = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const resetsAt = new Date(Date.parse(`${day}T00:00:00+08:00`) + 86400000).toISOString();
  return { day, resetsAt };
}
