"use client";

import { Suspense, type ReactNode } from "react";
import { FiGrid, FiSettings } from "react-icons/fi";
import { BsBookmark } from "react-icons/bs";
import { useAccountAccess } from "./AccountAccessProvider";
import MainButton from "./MainButton";
import LogoutButton from "./LogoutButton";
import ShortlistPanel from "./ShortlistPanel";
import { ROUTES } from "@/config/routes";
import SearchAllowance from "./SearchAllowance";
import { usePreferenceStore } from "@/store/preferenceStore";
import { openShortlistPanel } from "@/store/shortlistDetails";

/** `tone="header"` blends the bar into a pink page header directly below it (the results page). */
export default function AccountNavigation({ children, tone = "default" }: { children?: ReactNode; tone?: "default" | "header" }) {
  const { access, checking } = useAccountAccess();
  const shortlistCount = usePreferenceStore((state) => state.shortlist.length);
  if (checking || !access.userId) return null;
  // Admins don't plan weddings, so they have no dashboard or shortlist.
  const customer = access.role !== "admin";

  return <><nav aria-label="Account navigation" className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-(--positive-tertiary) ${tone === "header" ? "bg-(--positive)" : "border-b border-(--tertiary) bg-(--background)"}`}>
    <div><span className="libre-font text-lg">myweddingday.</span><SearchAllowance key={access.userId} /></div>
    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
      {children}
      {customer && <MainButton href={ROUTES.dashboard} variant="ghost" size="small">
        <FiGrid aria-hidden="true" />
        Dashboard
      </MainButton>}
      {customer && <MainButton variant="ghost" size="small" aria-haspopup="dialog" onClick={openShortlistPanel}
        aria-label={`Shortlist, ${shortlistCount} ${shortlistCount === 1 ? "vendor" : "vendors"}`}>
        <BsBookmark aria-hidden="true" />
        Shortlist
        {shortlistCount > 0 && <span aria-hidden="true"
          className="grid min-w-5 place-items-center rounded-full bg-(--positive-tertiary) px-1.5 text-[0.7rem] leading-5 text-white">{shortlistCount}</span>}
      </MainButton>}
      <MainButton href={ROUTES.settings} variant="ghost" size="small">
        <FiSettings aria-hidden="true" />
        Settings
      </MainButton>
      <LogoutButton />
    </div>
  </nav>
  {/* The panel reads the address (?shortlist=1), so it waits for it in its own boundary. */}
  {customer && <Suspense fallback={null}><ShortlistPanel /></Suspense>}
  </>;
}
