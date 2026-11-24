// Shared by pricing, result projection, allowance UI and server enforcement.
export const PLANS = {
  free: {
    // One manual search per account, ever.
    manualSearches: 1,
    // From that search, vendors per service shown in full (after the top pick, which stays a locked preview).
    // They stay unlocked permanently, for the shortlist and the budget.
    unlockedPerService: 1,
    aiTrialSearches: 1,
  },
  plus: {
    priceMYR: 20,
    durationYears: 1,
    aiSearchesPerWeek: 5,
  },
  aiSearchEnabled: false,
  timeZone: "Asia/Kuala_Lumpur",
} as const;

export const SEARCH = {
  lifetimeMs: 24 * 60 * 60 * 1000,
  pageSize: 10,
  // Vendors kept per service in each search: its best matches (see capMatches).
  maxPerService: 10,
  // Per-account limits. Action names are stored in search_request_limits.action (max 16 chars).
  requestsPerMinute: {
    create: 10,
    read: 60,
    detail: 30,
    selection: 30,
    planRead: 60,
    planWrite: 120,
    password: 5,
    shortlist: 30,
  },
} as const;

/** Lifetime manual searches allowed: unlimited (null) for Plus and admins, one for free accounts. */
export function manualSearchLimit(access: { role: string | null; isPaid: boolean }) {
  return access.role === "admin" || access.isPaid ? null : PLANS.free.manualSearches;
}
