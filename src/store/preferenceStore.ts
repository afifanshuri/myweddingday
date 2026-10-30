import { BasicPreferenceType, SelectedPackage } from "@/types/preferenceTypes";
import { create } from "zustand";
import {
  clearHiddenCriteria,
  hasCriteriaValue,
  SERVICE_CRITERIA,
} from "@/config/serviceCriteria";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ServiceType } from "@/types/dataTypes";

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
  manualSearch: { id: string; input: string; userId: string } | null;
  beginManualSearch: () => void;
  getManualSearchId: (input: string, userId: string) => string;
  selectionAccess: () => boolean;
  setSelectionAccess: (check: () => boolean) => void;
  redactSelectedPackages: () => void;
  selectPackage: (pkg: SelectedPackage) => void;
  removeSelectedPackage: (serviceId: number) => void;
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
};

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
      manualSearch: null,
      beginManualSearch: () => set({ manualSearch: null }),
      getManualSearchId: (input, userId) => {
        const previous = get().manualSearch;
        if (previous?.input === input && previous.userId === userId) return previous.id;
        const id = crypto.randomUUID();
        set({ manualSearch: { id, input, userId } });
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

      deleteAllPreferenceData: () => {
        set(() => ({
          manualSearch: null,
          preferencesList: [],
          selectedPackages: [],
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
      version: 2,
      migrate: (persisted) => {
        const state = persisted as Partial<PreferenceStore>;
        return {
          ...state,
          ...(state.weddingDetails ? { weddingDetails: { ...state.weddingDetails, serviceNames: state.weddingDetails.serviceNames ?? {} } } : {}),
          selectedPackages: (state.selectedPackages ?? []).map((pkg) => ({ ...pkg, vendorName: "", packageName: "" })),
        };
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        weddingDetails: state.weddingDetails,
        preferencesList: state.preferencesList,
        manualSearch: state.manualSearch,
        selectedPackages: state.selectedPackages.map((pkg) => ({ ...pkg, vendorName: "", packageName: "" })),
      }),
    },
  ),
);
