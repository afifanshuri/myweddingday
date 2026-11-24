import type { BasicPreferenceType, SelectedPackage } from "@/types/preferenceTypes";

/** The part of the planner that is saved to the user's account (one plan per account). */
export type SavedPlan = {
  weddingDetails: {
    coupleName: string;
    date: string | null;
    locations: number[];
    pax: number;
    services: number[];
    serviceNames: Record<number, string>;
  };
  preferencesList: BasicPreferenceType[];
  /** Vendor and package names are never stored; the budget panel looks them up for Plus users. */
  selectedPackages: SelectedPackage[];
  /** Vendors kept in view ("shortlisted"). Never part of the budget: only selectedPackages are. */
  shortlist: ShortlistEntry[];
  /** The most recent search. Its results stay on the server for 24 hours. */
  manualSearch: { id: string; input: string; pending?: boolean; createdAt?: number } | null;
  manualSearchRequested: boolean;
};

export type ShortlistEntry = { vendorId: number; serviceId: number };
export type SavedPlanResponse = { plan: SavedPlan | null; revision: number; updatedAt: string | null };

export const WEDDING_PLAN = {
  maxBodyBytes: 64 * 1024,
  coupleNameMax: 120,
  serviceNameMax: 100,
  descriptionMax: 1000,
  maxPax: 100000,
  maxLocations: 100,
  maxSearchInput: 32 * 1024,
  maxShortlist: 30,
  /** Wait this long after the last change before saving. */
  saveDelayMs: 800,
  retryDelayMs: 15000,
} as const;

export const emptyPlan = (): SavedPlan => ({
  weddingDetails: { coupleName: "", date: null, locations: [], pax: 0, services: [], serviceNames: {} },
  preferencesList: [], selectedPackages: [], shortlist: [], manualSearch: null, manualSearchRequested: false,
});

/** True when the plan holds anything the user entered. */
export function planHasContent(plan: SavedPlan) {
  const details = plan.weddingDetails;
  return Boolean(details.coupleName.trim() || details.date || details.locations.length || details.pax || details.services.length
    || plan.preferencesList.length || plan.selectedPackages.length || plan.shortlist.length || plan.manualSearch);
}
