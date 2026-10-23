import { BasicPreferenceType, SelectedPackage } from "@/types/preferenceTypes";
import { create } from "zustand";
import {
  clearHiddenCriteria,
  hasCriteriaValue,
  SERVICE_CRITERIA,
} from "@/config/serviceCriteria";
import { persist, createJSONStorage } from "zustand/middleware";

export type PreferenceStore = {
  weddingDetails: {
    coupleName: string;
    date: string | null;
    locations: number[];
    pax: number;
    services: number[];
  };
  preferencesList: BasicPreferenceType[];
  selectedPackages: SelectedPackage[];
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
      },
      preferencesList: [],
      selectedPackages: [],
      selectPackage: (pkg) => {
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
          weddingDetails: { ...state.weddingDetails, ...data },
          selectedPackages: data.services
            ? state.selectedPackages.filter((pkg) => data.services!.includes(pkg.serviceId))
            : state.selectedPackages,
        }));
      },

      deleteAllPreferenceData: () => {
        set(() => ({
          preferencesList: [],
          selectedPackages: [],
          weddingDetails: {
            coupleName: "",
            date: null,
            locations: [],
            pax: 0,
            services: [],
          },
        }));
      },
    }),
    {
      name: "preference-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        weddingDetails: state.weddingDetails,
        preferencesList: state.preferencesList,
        selectedPackages: state.selectedPackages,
      }),
    },
  ),
);
