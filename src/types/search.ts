import type { VendorMatchResult } from "./dtoTypes";

/** Manual searches: `limit` is the lifetime allowance (null for Plus and admins: unlimited). */
export type SearchUsage = {
  used: number;
  limit: number | null;
  remaining: number | null;
};

export type ManualSearchResult = {
  searchId: string;
  matches: VendorMatchResult[];
  topMatches: VendorMatchResult[];
  page: number;
  pageCount: number;
  total: number;
  /** Matches in the list (for the current service filter) that this account can't see without Plus. */
  lockedCount: number;
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
