import { SERVICE_ID } from "@/constants/commonConstants";
import { WeddingDetailType } from "@/types/dataTypes";
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
  weddingDetails : WeddingDetailType;
  totalBudget: number;
  pelaminPreference: BasicPreferenceType;
  venuePreference: BasicPreferenceType;
  photographerPreference: BasicPreferenceType;
  cateringPreference: BasicPreferenceType;
  muaPreference: BasicPreferenceType;
  clothingPreference: BasicPreferenceType;
  updatePreferenceDetails: (id:number, data: Partial<BasicPreferenceType>) => void;
  updateWeddingDetails: (data: Partial<WeddingDetailType>) => void;
  deleteAllPreferenceData: () => void;
};

export const usePreferenceStore = create<PreferenceStore>((set) => ({
  weddingDetails: {
    coupleName: "",
    date: null,
    locations: [],
    pax: 0,
  },
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

  updatePreferenceDetails: (id, data) => {
    set((state) => {
      switch (id) {
        case SERVICE_ID.VENUE:
          return {
            venuePreference: {
              ...state.venuePreference,
              ...data,
            },
          };

        case SERVICE_ID.PELAMIN:
          return {
            pelaminPreference: {
              ...state.pelaminPreference,
              ...data,
            },
          };

        case SERVICE_ID.CATERING:
          return {
            cateringPreference: {
              ...state.cateringPreference,
              ...data,
            },
          };

        case SERVICE_ID.PHOTOGRAPHER:
          return {
            photographerPreference: {
              ...state.photographerPreference,
              ...data,
            },
          };

        case SERVICE_ID.CLOTHING:
          return {
            clothingPreference: {
              ...state.clothingPreference,
              ...data,
            },
          };
        case SERVICE_ID.MUA:
          return {
            muaPreference: {
              ...state.muaPreference,
              ...data,
            },
          };

        default:
          return state;
      }
    })
  },
  updateWeddingDetails: (data) => {
    set((state) => ({
      weddingDetails: {
        ...state.weddingDetails,
        ...data
      }
    }))
  },
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
