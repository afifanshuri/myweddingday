import { SERVICE_ID } from "@/constants/commonConstants";
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
        case SERVICE_ID.VENUE:
          return {
            venuePreference: {
              ...state.venuePreference,
              budget,
            },
          };

        case SERVICE_ID.PELAMIN:
          return {
            pelaminPreference: {
              ...state.pelaminPreference,
              budget,
            },
          };

        case SERVICE_ID.CATERING:
          return {
            cateringPreference: {
              ...state.cateringPreference,
              budget,
            },
          };

        case SERVICE_ID.PHOTOGRAPHER:
          return {
            photographerPreference: {
              ...state.photographerPreference,
              budget,
            },
          };

        case SERVICE_ID.CLOTHING:
          return {
            muaPreference: {
              ...state.muaPreference,
              budget,
            },
          };
        case SERVICE_ID.MUA:
          return {
            muaPreference: {
              ...state.muaPreference,
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
        case SERVICE_ID.VENUE:
          return {
            venuePreference: {
              ...state.venuePreference,
              style: styles,
            },
          };

        case SERVICE_ID.PELAMIN:
          return {
            pelaminPreference: {
              ...state.pelaminPreference,
              style: styles,
            },
          };

        case SERVICE_ID.CATERING:
          return {
            cateringPreference: {
              ...state.cateringPreference,
              style: styles,
            },
          };

        case SERVICE_ID.PHOTOGRAPHER:
          return {
            photographerPreference: {
              ...state.photographerPreference,
              style: styles,
            },
          };
        case SERVICE_ID.CLOTHING:
          return {
            clothingPreference: {
              ...state.clothingPreference,
              style: styles,
            },
          };
        case SERVICE_ID.MUA:
          return {
            muaPreference: {
              ...state.muaPreference,
              style: styles,
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
    }));
  },
}));
