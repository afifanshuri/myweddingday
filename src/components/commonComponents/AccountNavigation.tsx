"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiGrid, FiMenu, FiSettings, FiX } from "react-icons/fi";
import { BsBookmark } from "react-icons/bs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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

// The page you're on is filled in.
const current = "aria-[current=page]:bg-(--secondary) aria-[current=page]:font-semibold";
const menuRow = `w-full justify-start ${current}`;

/**
 * The signed-in bar: brand (back to the start), then places to go (Dashboard, Shortlist, or the admin pages passed
 * in as children), then account controls (language, Settings, log out). On phones everything after the brand
 * moves into a menu that drops down from the bar.
 * `tone="header"` blends the bar into a pink page header directly below it (the results page).
 */
export default function AccountNavigation({ children, tone = "default" }: { children?: ReactNode; tone?: "default" | "header" }) {
  const { access, checking } = useAccountAccess();
  const shortlistCount = usePreferenceStore((state) => state.shortlist.length);
  const pathname = usePathname();
  const t = useT();
  const reduceMotion = useReducedMotion();
  const menuId = useId();
  const bar = useRef<HTMLElement>(null);
  // The menu belongs to the page it was opened on, so moving to another page closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const menuOpen = openOn === pathname;
  const closeMenu = () => setOpenOn(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenOn(null); };
    const onClick = (event: MouseEvent) => { if (!bar.current?.contains(event.target as Node)) setOpenOn(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [menuOpen]);

  if (checking || !access.userId) return null;
  // Admins don't plan weddings, so they have no dashboard or shortlist.
  const customer = access.role !== "admin";
  const home = customer ? ROUTES.dashboard : ROUTES.admin;
  const page = (route: string) => pathname === route ? "page" as const : undefined;

  // The same places, as buttons in the bar or rows in the phone menu.
  const places = (row: boolean) => <>
    {customer && <MainButton href={ROUTES.dashboard} variant="ghost" size="small" aria-current={page(ROUTES.dashboard)}
      className={row ? menuRow : current} onClick={row ? closeMenu : undefined}>
      <FiGrid aria-hidden="true" />{t.nav.dashboard}
    </MainButton>}
    {customer && <MainButton variant="ghost" size="small" aria-haspopup="dialog" aria-label={t.nav.shortlistAria(shortlistCount)}
      className={row ? menuRow : undefined} onClick={() => { if (row) closeMenu(); openShortlistPanel(); }}>
      <BsBookmark aria-hidden="true" />{t.nav.shortlist}
    </MainButton>}
  </>;
  const settings = (row: boolean) => <MainButton href={ROUTES.settings} variant="ghost" size="small" aria-current={page(ROUTES.settings)}
    className={row ? menuRow : current} onClick={row ? closeMenu : undefined}>
    <FiSettings aria-hidden="true" />{t.nav.settings}
  </MainButton>;

  return <><nav ref={bar} aria-label={t.nav.ariaLabel} className={`relative z-40 flex items-center gap-3 px-4 py-3 text-(--positive-tertiary) sm:px-5 ${tone === "header" ? "bg-(--positive)" : "border-b border-(--tertiary) bg-(--background)"}`}>
    {/* Brand: back to the start (the logo is a second, mouse-only way in; the name is the link that's announced). */}
    <div className="flex min-w-0 items-center gap-2">
      <Link href={home} tabIndex={-1} aria-hidden="true" className="shrink-0">
        <Image src="/brand/my-wedding-day-mark-knot.png" alt="" width={40} height={40} priority className="size-9 sm:size-10" />
      </Link>
      <div className="min-w-0">
        <Link href={home} className="libre-font rounded text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary)">myweddingday.</Link>
        <SearchAllowance key={access.userId} />
      </div>
    </div>

    {/* Tablet and up: places to go | account controls. */}
    <div className="ml-auto flex items-center gap-2 max-sm:hidden">
      {children}
      {places(false)}
      <span aria-hidden="true" className="mx-2 h-6 w-px bg-(--tertiary)" />
      <LanguageSwitch />
      {settings(false)}
      <LogoutButton />
    </div>

    {/* Phones: one button that opens the menu below. */}
    <MainButton variant="ghost" size="icon" className="ml-auto shrink-0 sm:hidden" aria-expanded={menuOpen} aria-controls={menuId}
      aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu} onClick={() => setOpenOn(menuOpen ? null : pathname)}>
      {menuOpen ? <FiX aria-hidden="true" className="size-5" /> : <FiMenu aria-hidden="true" className="size-5" />}
    </MainButton>
    <AnimatePresence>
      {menuOpen && <motion.div id={menuId} key="menu"
        className="absolute inset-x-0 top-full border-b border-(--tertiary) bg-(--background) px-4 pb-4 pt-2 shadow-lg sm:hidden"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, transition: { duration: 0.12 } }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex flex-col gap-1" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) closeMenu(); }}>
          {children}
          {places(true)}
        </div>
        <div className="mt-2 flex flex-col gap-1 border-t border-(--tertiary) pt-2">
          {settings(true)}
          <div className="flex items-center justify-between gap-3 px-[0.85rem] py-1.5 text-sm">
            <span>{t.language.label}</span>
            <LanguageSwitch />
          </div>
          <LogoutButton labelled />
        </div>
      </motion.div>}
    </AnimatePresence>
  </nav>
  {/* The shortlist panel (opened from the button above); its open state is kept in memory, not in the address. */}
  {customer && <ShortlistPanel />}
  </>;
}
