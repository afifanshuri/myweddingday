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
  preferencesList: BasicPreferenceType[];
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
  preferencesList: [ {
    serviceId: SERVICE_ID.PELAMIN,
    budget: 0,
    description: "",
    style: [],
    styleOptions: pelaminStyles,
    embedding: null,
  }, 
  {
    serviceId: SERVICE_ID.VENUE,
    budget: 0,
    description: "",
    style: [],
    styleOptions: venueStyles,
    embedding: null,
  },
  {
    serviceId: SERVICE_ID.PHOTOGRAPHER,
    budget: 0,
    description: "",
    style: [],
    styleOptions: photographerStyles,
    embedding: null,
  },
  {
    serviceId: SERVICE_ID.CATERING,
    budget: 0,
    description: "",
    style: [],
    styleOptions: cateringStyles,
    embedding: null,
  },
  {
    serviceId: SERVICE_ID.MUA,
    budget: 0,
    description: "",
    style: [],
    styleOptions: muaStyles,
    embedding: null,
  },
  {
    serviceId: SERVICE_ID.CLOTHING,
    budget: 0,
    description: "",
    style: [],
    styleOptions: clothingStyles,
    embedding: null,
  },
  ],

  updatePreferenceDetails: (id, data) => {
    set((state) => ({
      preferencesList: state.preferencesList.map((preference) =>
        preference.serviceId === id ? { ...preference, ...data } : preference,
      )
    }))
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
      preferencesList: [ {
    serviceId: SERVICE_ID.PELAMIN,
    budget: 0,
    description: "",
    style: [],
    styleOptions: pelaminStyles,
    embedding: null,
  }, 
  {
    serviceId: SERVICE_ID.VENUE,
    budget: 0,
    description: "",
    style: [],
    styleOptions: venueStyles,
    embedding: null,
  },
  {
    serviceId: SERVICE_ID.PHOTOGRAPHER,
    budget: 0,
    description: "",
    style: [],
    styleOptions: photographerStyles,
    embedding: null,
  },
  {
    serviceId: SERVICE_ID.CATERING,
    budget: 0,
    description: "",
    style: [],
    styleOptions: cateringStyles,
    embedding: null,
  },
  {
    serviceId: SERVICE_ID.MUA,
    budget: 0,
    description: "",
    style: [],
    styleOptions: muaStyles,
    embedding: null,
  },
  {
    serviceId: SERVICE_ID.CLOTHING,
    budget: 0,
    description: "",
    style: [],
    styleOptions: clothingStyles,
    embedding: null,
  },
  ],
    }));
  },
}));
