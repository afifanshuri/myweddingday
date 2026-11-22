"use client";

import type { ReactNode } from "react";
import { FiGrid } from "react-icons/fi";
import { useAccountAccess } from "./AccountAccessProvider";
import MainButton from "./MainButton";
import LogoutButton from "./LogoutButton";
import { ROUTES } from "@/config/routes";
import SearchAllowance from "./SearchAllowance";

export default function AccountNavigation({ children }: { children?: ReactNode }) {
  const { access, checking } = useAccountAccess();
  if (checking || !access.userId) return null;

  return <nav aria-label="Account navigation" className="flex flex-wrap items-center justify-between gap-3 border-b border-(--tertiary) bg-(--background) px-5 py-3 text-(--positive-tertiary)">
    <div><span className="libre-font text-lg">myweddingday.</span><SearchAllowance key={access.userId} /></div>
    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
      {children}
      {access.role !== "admin" && <MainButton href={ROUTES.dashboard} variant="ghost" size="small">
        <FiGrid aria-hidden="true" />
        Dashboard
      </MainButton>}
      <LogoutButton />
    </div>
  </nav>;
}
