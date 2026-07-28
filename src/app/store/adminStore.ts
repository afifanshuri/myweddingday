import { PackageType, VendorType } from "@/types/dataTypes";
import { create } from "zustand";

type AdminStore = {
  vendor: VendorType;
  packageList: PackageType[];
  addPackage: () => void;
  deletePackage: (id: number) => void;
  updatePackage: (id: number, data: Partial<PackageType>) => void;
  updateVendor: (data: Partial<VendorType>) => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
  vendor: {
    id: 0,
    createdAt: new Date(),
    vendorName: "<Vendor Name>",
    serviceId: 0,
    locationId: [],
    detail: null,
    contact: null,
    rating: null,
  },
  packageList: [],
  addPackage: () => {
    set((state) => {
      const currentId =
        state.packageList.length == 0
          ? 1
          : state.packageList[state.packageList.length - 1].id + 1;
      const newPkg: PackageType = {
        id: currentId,
        name: "",
        price: 0,
        file: null,
        details: null,
        vendorId: null,
        tags: [],
      };

      return {
        packageList: [...state.packageList, newPkg],
      };
    });
  },
  deletePackage: (id: number) => {
    set((state) => {
      const newPkgList = state.packageList.filter((p) => p.id !== id);

      return { packageList: newPkgList };
    });
  },
  updatePackage: (id, data) => {
    set((state) => {
      const newPkgList = state.packageList.map((p) =>
        p.id == id ? { ...p, ...data } : p,
      );
      return { packageList: newPkgList };
    });
  },
  updateVendor: (data) => {
    set((state) => {
      const newVendor = {
        ...state.vendor,
        ...data,
      };
      return { vendor: newVendor };
    });
  },
}));
