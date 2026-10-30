// Shared by pricing, preview projection, usage UI and server enforcement.
export const PLANS = {
  free: { manualSearchesPerDay: 3, vendorPreviews: null, aiTrialSearches: 1 },
  plus: { priceMYR: 20, durationYears: 1, manualSearchesPerDay: null, aiSearchesPerWeek: 5 },
  aiSearchEnabled: false,
  timeZone: "Asia/Kuala_Lumpur",
} as const;

export function manualSearchLimit(access: { role: string | null; isPaid: boolean }) {
  return access.role === "admin" || access.isPaid ? null : PLANS.free.manualSearchesPerDay;
}

export function searchDay(now = new Date()) {
  // Malaysia uses UTC+8 without daylight-saving changes.
  const day = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const resetsAt = new Date(Date.parse(`${day}T00:00:00+08:00`) + 86400000).toISOString();
  return { day, resetsAt };
}
