import { UserType } from "@/types/dataTypes";
import { create } from "zustand";

type UserStore = {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: {
    id: 0,
    createdAt: new Date(),
    email: "",
    firstName: "",
    lastName: "",
    phone: null,
    role: "user",
  },
  setUser: (user: UserType | null) => set({ user }),
}));
