import { BasicPreferenceType } from "@/types/preferenceTypes";
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
        }));
      },

      deleteAllPreferenceData: () => {
        set(() => ({
          preferencesList: [],
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
      }),
    },
  ),
);
