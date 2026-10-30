import type { VendorMatchResult } from "./dtoTypes";

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
