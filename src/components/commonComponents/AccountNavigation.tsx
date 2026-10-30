"use client";

import type { ReactNode } from "react";
import { FiGrid, FiSearch } from "react-icons/fi";
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
    {access.isPaid && <label className="order-last flex w-full items-center gap-2 rounded-lg border border-(--tertiary) bg-white px-3 py-2 sm:order-none sm:ml-4 sm:w-auto sm:max-w-sm sm:flex-1">
      <span className="sr-only">Search vendors by name (coming soon)</span>
      <FiSearch aria-hidden="true" className="shrink-0 text-foreground/50" />
      <input type="search" disabled placeholder="Search vendors · Coming soon"
        className="min-w-0 w-full cursor-not-allowed bg-transparent text-sm text-foreground/60 placeholder:text-foreground/50" />
    </label>}
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
