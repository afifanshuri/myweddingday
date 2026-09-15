import { ServiceType } from "@/types/dataTypes";
import { create } from "zustand";

type ServiceStore = {
  service: ServiceType[];
  isLoaded: boolean;
  selectedService: number[];
  currentActiveServicePage: number;
  currentActiveServiceTab: number;
  initServices: () => Promise<void>;
  addAllService: (services: ServiceType[]) => void;
  addSelectedService: (id: number) => void;
  removeSelectedService: (id: number) => void;
  addAllSelectedService: (serviceList: number[]) => void;
  changeCurrentActiveServicePage: (id: number) => void;
  changeCurrentActiveServiceTab: (id: number) => void;
  deleteAllService: () => void;
};

export const useServiceStore = create<ServiceStore>((set, get) => ({
  service: [],
  isLoaded: false,
  selectedService: [],
  currentActiveServicePage: 0,
  currentActiveServiceTab: 0,

  initServices: async () => {
    if (get().isLoaded) return;
    const services = await fetch("/api/services").then((r) => r.json());
    set({ service: services, isLoaded: true });
  },

  addAllService: (services: ServiceType[]) => {
    set(() => ({
      service: services,
      isLoaded: true,
    }));
  },
  addSelectedService: (id: number) => {
    set((state) => ({
      selectedService: state.selectedService.includes(id)
        ? state.selectedService
        : [...state.selectedService, id],
    }));
  },
  removeSelectedService: (id: number) => {
    set((state) => ({
      selectedService: state.selectedService.filter((s) => s !== id),
    }));
  },
  addAllSelectedService: (serviceList: number[]) => {
    set(() => ({
      selectedService: serviceList.sort((a, b) => a - b),
    }));
  },
  changeCurrentActiveServicePage: (id: number) => {
    set(() => ({
      currentActiveServicePage: id,
    }));
  },
  changeCurrentActiveServiceTab: (id: number) => {
    set(() => ({
      currentActiveServiceTab: id,
    }));
  },
  deleteAllService: () => {
    set(() => ({
      selectedService: [],
    }));
  },
}));
