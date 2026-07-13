import { BasicPreferenceType } from "@/types/preferenceTypes";
import { create } from "zustand";

const venueStyles = [
  "Modern",
  "Traditional",
  "Enchanted",
  "Glasshouse",
  "Intimate",
  "Large",
  "Large Parking Lot",
];
const pelaminStyles = [
  "Modern",
  "Traditional",
  "All white",
  "Floral",
  "Mini Pelamin",
  "Cushion",
];
const photographerStyles = [
  "Classic",
  "Retro",
  "Blurry",
  "Modern",
  "Photo Only",
  "Video Only",
  "Photo and Video",
];
const cateringStyles = [
  "Cheapest per pax",
  "1000 pax",
  "Modern",
  "Photo Only",
  "Video Only",
  "Photo and Video",
];
const muaStyles = [
  "Cheapest per pax",
  "1000 pax",
  "Modern",
  "Photo Only",
  "Video Only",
  "Photo and Video",
];
const clothingStyles = [
  "Cheapest per pax",
  "1000 pax",
  "Modern",
  "Photo Only",
  "Video Only",
  "Photo and Video",
];

export type PreferenceStore = {
  totalBudget: number;
  pelaminPreference: BasicPreferenceType;
  venuePreference: BasicPreferenceType;
  photographerPreference: BasicPreferenceType;
  cateringPreference: BasicPreferenceType;
  muaPreference: BasicPreferenceType;
  clothingPreference: BasicPreferenceType;
  setBudget: (id: number, amount: number) => void;
  setStyles: (id: number, styles: string[]) => void;
  deleteAllPreferenceData: () => void;
};

export const usePreferenceStore = create<PreferenceStore>((set) => ({
  totalBudget: 0,
  pelaminPreference: {
    budget: 0,
    description: "",
    style: [],
    styleOptions: pelaminStyles,
  },
  venuePreference: {
    budget: 0,
    description: "",
    style: [],
    styleOptions: venueStyles,
  },
  photographerPreference: {
    budget: 0,
    description: "",
    style: [],
    styleOptions: photographerStyles,
  },
  cateringPreference: {
    budget: 0,
    description: "",
    style: [],
    styleOptions: cateringStyles,
  },
  muaPreference: {
    budget: 0,
    description: "",
    style: [],
    styleOptions: muaStyles,
  },
  clothingPreference: {
    budget: 0,
    description: "",
    style: [],
    styleOptions: clothingStyles,
  },

  setBudget: (serviceId, budget) =>
    set((state) => {
      switch (serviceId) {
        case 1:
          return {
            venuePreference: {
              ...state.venuePreference,
              budget,
            },
          };

        case 2:
          return {
            pelaminPreference: {
              ...state.pelaminPreference,
              budget,
            },
          };

        case 3:
          return {
            cateringPreference: {
              ...state.cateringPreference,
              budget,
            },
          };

        case 4:
          return {
            photographerPreference: {
              ...state.photographerPreference,
              budget,
            },
          };

        default:
          return state;
      }
    }),

  setStyles: (serviceId, styles) =>
    set((state) => {
      switch (serviceId) {
        case 1:
          return {
            venuePreference: {
              ...state.venuePreference,
              styles,
            },
          };

        case 2:
          return {
            pelaminPreference: {
              ...state.pelaminPreference,
              styles,
            },
          };

        case 3:
          return {
            cateringPreference: {
              ...state.cateringPreference,
              styles,
            },
          };

        case 4:
          return {
            photographerPreference: {
              ...state.photographerPreference,
              styles,
            },
          };

        default:
          return state;
      }
    }),
  deleteAllPreferenceData: () => {
    set(() => ({
      pelaminPreference: {
        budget: 0,
        description: "",
        style: [],
        styleOptions: pelaminStyles,
      },
      venuePreference: {
        budget: 0,
        description: "",
        style: [],
        styleOptions: venueStyles,
      },
      photographerPreference: {
        budget: 0,
        description: "",
        style: [],
        styleOptions: photographerStyles,
      },
      cateringPreference: {
        budget: 0,
        description: "",
        style: [],
        styleOptions: cateringStyles,
      },
    }));
  },
}));
