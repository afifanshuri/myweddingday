import type { VendorDetailedMatch, VendorMatchResult } from "./dtoTypes";

export type VendorLookupResult = {
  query: string;
  results: VendorDetailedMatch[];
  /** True when more vendors match than the result cap; the user should refine the query. */
  limited: boolean;
};

export type SearchUsage = {
  used: number;
  limit: number | null;
  remaining: number | null;
  resetsAt: string;
};

export type ManualSearchResult = {
  searchId: string;
  matches: VendorMatchResult[];
  topMatches: VendorMatchResult[];
  page: number;
  pageCount: number;
  total: number;
  expiresAt: string;
  usage: SearchUsage;
};

export type SnapshotMatch = {
  vendorId: number;
  serviceId: number;
  matchedPackageIds: number[];
  position: number;
  isTopPick: boolean;
};
