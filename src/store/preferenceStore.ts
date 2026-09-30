import { BasicPreferenceType } from "@/types/preferenceTypes";
import { create } from "zustand";

export type PreferenceStore = {
  weddingDetails: {
    coupleName: string;
    date: Date | null;
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
  deleteAllPreferenceData: () => void;
};

export const usePreferenceStore = create<PreferenceStore>((set, get) => ({
  weddingDetails: {
    coupleName: "",
    date: null,
    locations: [],
    pax: 0,
    services: [],
  },
  preferencesList: [],

  updatePreferenceDetails: (id, data) => {
    set((state) => {
      const exists = state.preferencesList.some((p) => p.serviceId === id);
      if (!exists) {
        return {
          preferencesList: [
            ...state.preferencesList,
            {
              serviceId: id,
              budget: 0,
              description: "",
              criteria: {},
              ...data,
            },
          ],
        };
      }
      return {
        preferencesList: state.preferencesList.map((p) =>
          p.serviceId === id ? { ...p, ...data } : p,
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
}));
