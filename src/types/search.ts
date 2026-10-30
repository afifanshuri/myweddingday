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
  usage: SearchUsage;
};
