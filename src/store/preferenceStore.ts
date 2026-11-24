import { BasicPreferenceType, SelectedPackage } from "@/types/preferenceTypes";
import { create } from "zustand";
import {
  clearHiddenCriteria,
  hasCriteriaValue,
  SERVICE_CRITERIA,
} from "@/config/serviceCriteria";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ServiceType } from "@/types/dataTypes";
import { WEDDING_PLAN, type SavedPlan, type ShortlistEntry } from "@/config/weddingPlan";

/** Which account the plan in this browser belongs to, the saved version it is based on, and whether it has unsaved changes. */
export type PlanSyncState = { owner: string | null; revision: number; dirty: boolean };
const NO_SYNC: PlanSyncState = { owner: null, revision: 0, dirty: false };

export type PreferenceStore = {
  weddingDetails: {
    coupleName: string;
    date: string | null;
    locations: number[];
    pax: number;
    services: number[];
    serviceNames: Record<number, string>;
  };
  preferencesList: BasicPreferenceType[];
  selectedPackages: SelectedPackage[];
  /** Vendors kept in view. Separate from selectedPackages: a shortlisted vendor is never part of the budget. */
  shortlist: ShortlistEntry[];
  /** Adds or removes a vendor. Returns false when the shortlist is full. */
  toggleShortlist: (vendorId: number, serviceId: number) => boolean;
  removeFromShortlist: (vendorIds: number[]) => void;
  manualSearch: { id: string; input: string; userId: string; pending?: boolean; createdAt?: number } | null;
  manualSearchRequested: boolean;
  completeManualSearch: (id: string) => void;
  beginManualSearch: () => void;
  getManualSearchId: (input: string, userId: string) => string;
  selectionAccess: () => boolean;
  setSelectionAccess: (check: () => boolean) => void;
  redactSelectedPackages: () => void;
  selectPackage: (pkg: SelectedPackage) => void;
  removeSelectedPackage: (serviceId: number) => void;
  /** Removes every chosen package from the budget (the rest of the plan is kept). */
  clearSelectedPackages: () => void;
  updatePreferenceDetails: (
    id: number,
    data: Partial<BasicPreferenceType>,
  ) => void;
  updateWeddingDetails: (
    data: Partial<PreferenceStore["weddingDetails"]>,
  ) => void;
  updateRequiredFields: (serviceId: number, fields: string[]) => void;
  syncServiceNames: (services: Pick<ServiceType, "id" | "serviceName">[]) => void;
  deleteAllPreferenceData: () => void;
  planSync: PlanSyncState;
  setPlanSync: (update: Partial<PlanSyncState>) => void;
  /** Replaces the plan in this browser with the account's saved plan. */
  applySavedPlan: (plan: SavedPlan, owner: string, revision: number) => void;
};

/** The parts of the store saved to the account. Vendor and package names are left out. */
export function planSnapshot(state: Pick<PreferenceStore, "weddingDetails" | "preferencesList" | "selectedPackages" | "shortlist" | "manualSearch" | "manualSearchRequested">): SavedPlan {
  return {
    weddingDetails: state.weddingDetails,
    preferencesList: state.preferencesList,
    selectedPackages: state.selectedPackages.map((pkg) => ({ ...pkg, vendorName: "", packageName: "" })),
    shortlist: state.shortlist,
    manualSearch: state.manualSearch ? { id: state.manualSearch.id, input: state.manualSearch.input, pending: state.manualSearch.pending ?? false,
      ...(state.manualSearch.createdAt ? { createdAt: state.manualSearch.createdAt } : {}) } : null,
    manualSearchRequested: state.manualSearchRequested,
  };
}

export const usePreferenceStore = create<PreferenceStore>()(
  persist(
    (set, get) => ({
      weddingDetails: {
        coupleName: "",
        date: null,
        locations: [],
        pax: 0,
        services: [],
        serviceNames: {},
      },
      preferencesList: [],
      selectedPackages: [],
      shortlist: [],
      toggleShortlist: (vendorId, serviceId) => {
        const current = get().shortlist;
        if (current.some((entry) => entry.vendorId === vendorId)) {
          set({ shortlist: current.filter((entry) => entry.vendorId !== vendorId) });
          return true;
        }
        if (current.length >= WEDDING_PLAN.maxShortlist) return false;
        set({ shortlist: [...current, { vendorId, serviceId }] });
        return true;
      },
      removeFromShortlist: (vendorIds) => set((state) => {
        const next = state.shortlist.filter((entry) => !vendorIds.includes(entry.vendorId));
        return next.length === state.shortlist.length ? state : { shortlist: next };
      }),
      manualSearch: null,
      manualSearchRequested: false,
      completeManualSearch: (id) => set((state) => state.manualSearch?.id === id
        ? { manualSearch: { ...state.manualSearch, pending: false } } : {}),
      beginManualSearch: () => set({ manualSearch: null, manualSearchRequested: true }),
      getManualSearchId: (input, userId) => {
        const previous = get().manualSearch;
        if (previous?.input === input && previous.userId === userId) return previous.id;
        const id = crypto.randomUUID();
        set({ manualSearch: { id, input, userId, pending: true, createdAt: Date.now() }, manualSearchRequested: false });
        return id;
      },
      selectionAccess: () => false,
      setSelectionAccess: (check) => set({ selectionAccess: check }),
      redactSelectedPackages: () => set((state) => ({ selectedPackages: state.selectedPackages.map((pkg) => ({ ...pkg, vendorName: "", packageName: "" })) })),
      selectPackage: (pkg) => {
        if (!get().selectionAccess()) return;
        if (!Number.isFinite(pkg.unitPrice) || pkg.unitPrice <= 0) return;
        set((state) => state.weddingDetails.services.includes(pkg.serviceId) ? ({
          selectedPackages: [...state.selectedPackages.filter((item) => item.serviceId !== pkg.serviceId), pkg],
        }) : {});
      },
      clearSelectedPackages: () => set({ selectedPackages: [] }),
      removeSelectedPackage: (serviceId) => set((state) => ({
        selectedPackages: state.selectedPackages.filter((pkg) => pkg.serviceId !== serviceId),
      })),
      updateRequiredFields: (serviceId, fields) => {
        get().updatePreferenceDetails(serviceId, { requiredFields: fields });
      },
      updatePreferenceDetails: (id, data) => {
        set((state) => {
          const current = state.preferencesList.find((p) => p.serviceId === id);
          const definitions = SERVICE_CRITERIA[id] ?? [];
          const criteria = Object.fromEntries(
            Object.entries(
              clearHiddenCriteria(
                definitions,
                data.criteria ?? current?.criteria ?? {},
              ),
            ).filter(
              ([key, value]) =>
                definitions.some((field) => field.key === key) &&
                hasCriteriaValue(value),
            ),
          );
          const requiredFields = [
            ...new Set(data.requiredFields ?? current?.requiredFields ?? []),
          ].filter((key) => hasCriteriaValue(criteria[key]));
          const updated = { ...data, criteria, requiredFields };
          const exists = state.preferencesList.some((p) => p.serviceId === id);
          if (!exists) {
            return {
              preferencesList: [
                ...state.preferencesList,
                {
                  serviceId: id,
                  budget: 0,
                  description: "",
                  ...updated,
                },
              ],
            };
          }
          return {
            preferencesList: state.preferencesList.map((p) =>
              p.serviceId === id ? { ...p, ...updated } : p,
            ),
          };
        });
      },

      updateWeddingDetails: (data) => {
        set((state) => ({
          weddingDetails: {
            ...state.weddingDetails, ...data,
            serviceNames: Object.fromEntries((data.services ?? state.weddingDetails.services)
              .filter((id) => (data.serviceNames ?? state.weddingDetails.serviceNames)[id])
              .map((id) => [id, (data.serviceNames ?? state.weddingDetails.serviceNames)[id]])),
          },
          selectedPackages: data.services
            ? state.selectedPackages.filter((pkg) => data.services!.includes(pkg.serviceId))
            : state.selectedPackages,
        }));
      },

      syncServiceNames: (services) => set((state) => {
        const serviceNames = Object.fromEntries(state.weddingDetails.services.flatMap((id) => {
          const name = services.find((service) => service.id === id)?.serviceName
            ?? state.weddingDetails.serviceNames[id];
          return name ? [[id, name]] : [];
        }));
        return JSON.stringify(serviceNames) === JSON.stringify(state.weddingDetails.serviceNames)
          ? state : { weddingDetails: { ...state.weddingDetails, serviceNames } };
      }),

      planSync: NO_SYNC,
      setPlanSync: (update) => set((state) => ({ planSync: { ...state.planSync, ...update } })),
      applySavedPlan: (plan, owner, revision) => set({
        weddingDetails: plan.weddingDetails,
        preferencesList: plan.preferencesList,
        selectedPackages: plan.selectedPackages,
        shortlist: plan.shortlist ?? [],
        manualSearch: plan.manualSearch ? { ...plan.manualSearch, userId: owner } : null,
        manualSearchRequested: plan.manualSearchRequested,
        planSync: { owner, revision, dirty: false },
      }),

      deleteAllPreferenceData: () => {
        set(() => ({
          manualSearch: null,
          manualSearchRequested: false,
          preferencesList: [],
          selectedPackages: [],
          shortlist: [],
          weddingDetails: {
            coupleName: "",
            date: null,
            locations: [],
            pax: 0,
            services: [],
            serviceNames: {},
          },
        }));
      },
    }),
    {
      name: "preference-storage",
      version: 3,
      migrate: (persisted) => {
        const state = persisted as Partial<PreferenceStore>;
        return {
          ...state,
          // Plans saved before accounts kept them belong to no one yet; the next sign-in decides (see PlanSync).
          planSync: state.planSync ?? NO_SYNC,
          shortlist: state.shortlist ?? [],
          ...(state.weddingDetails ? { weddingDetails: { ...state.weddingDetails, serviceNames: state.weddingDetails.serviceNames ?? {} } } : {}),
          selectedPackages: (state.selectedPackages ?? []).map((pkg) => ({ ...pkg, vendorName: "", packageName: "" })),
        };
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        weddingDetails: state.weddingDetails,
        preferencesList: state.preferencesList,
        manualSearch: state.manualSearch,
        manualSearchRequested: state.manualSearchRequested,
        selectedPackages: state.selectedPackages.map((pkg) => ({ ...pkg, vendorName: "", packageName: "" })),
        shortlist: state.shortlist,
        planSync: state.planSync,
      }),
    },
  ),
);
