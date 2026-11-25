"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { FiGrid, FiSettings } from "react-icons/fi";
import { BsBookmark } from "react-icons/bs";
import { useAccountAccess } from "./AccountAccessProvider";
import MainButton from "./MainButton";
import LogoutButton from "./LogoutButton";
import ShortlistPanel from "./ShortlistPanel";
import { ROUTES } from "@/config/routes";
import SearchAllowance from "./SearchAllowance";
import LanguageSwitch from "./LanguageSwitch";
import { useT } from "@/i18n";
import { usePreferenceStore } from "@/store/preferenceStore";
import { openShortlistPanel } from "@/store/shortlistDetails";

/** `tone="header"` blends the bar into a pink page header directly below it (the results page). */
export default function AccountNavigation({ children, tone = "default" }: { children?: ReactNode; tone?: "default" | "header" }) {
  const { access, checking } = useAccountAccess();
  const shortlistCount = usePreferenceStore((state) => state.shortlist.length);
  const t = useT();
  if (checking || !access.userId) return null;
  // Admins don't plan weddings, so they have no dashboard or shortlist.
  const customer = access.role !== "admin";

  return <><nav aria-label={t.nav.ariaLabel} className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-(--positive-tertiary) ${tone === "header" ? "bg-(--positive)" : "border-b border-(--tertiary) bg-(--background)"}`}>
    <div className="flex items-center gap-2">
      <Image src="/brand/my-wedding-day-mark-knot.png" alt="" width={40} height={40} priority className="size-10 shrink-0" />
      <div><span className="libre-font text-lg">myweddingday.</span><SearchAllowance key={access.userId} /></div>
    </div>
    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
      {children}
      <LanguageSwitch />
      {customer && <MainButton href={ROUTES.dashboard} variant="ghost" size="small">
        <FiGrid aria-hidden="true" />
        {t.nav.dashboard}
      </MainButton>}
      {customer && <MainButton variant="ghost" size="small" aria-haspopup="dialog" onClick={openShortlistPanel}
        aria-label={t.nav.shortlistAria(shortlistCount)}>
        <BsBookmark aria-hidden="true" />
        {t.nav.shortlist}
        {shortlistCount > 0 && <span aria-hidden="true"
          className="grid min-w-5 place-items-center rounded-full bg-(--positive-tertiary) px-1.5 text-[0.7rem] leading-5 text-white">{shortlistCount}</span>}
      </MainButton>}
      <MainButton href={ROUTES.settings} variant="ghost" size="small">
        <FiSettings aria-hidden="true" />
        {t.nav.settings}
      </MainButton>
      <LogoutButton />
    </div>
  </nav>
  {/* The shortlist panel (opened from the button above); its open state is kept in memory, not in the address. */}
  {customer && <ShortlistPanel />}
  </>;
}
