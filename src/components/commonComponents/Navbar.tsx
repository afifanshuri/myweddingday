"use client";

import MainButton from "./MainButton";
import Image from "next/image";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FiMenu, FiX } from "react-icons/fi";
import { ROUTES } from "@/config/routes";
import { useT } from "@/i18n";
import LanguageSwitch from "./LanguageSwitch";

function subscribeToScroll(onScroll: () => void) {
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

function getScrollSnapshot() {
  return window.scrollY > 16;
}

function getServerSnapshot() {
  return false;
}

const link = "whitespace-nowrap rounded-sm transition hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

/** The landing page bar (signed-out visitors): sections, language and Login. On phones the links move into a menu. */
export default function Navbar() {
  const isScrolled = useSyncExternalStore(subscribeToScroll, getScrollSnapshot, getServerSnapshot);
  const t = useT();
  const reduceMotion = useReducedMotion();
  const menuId = useId();
  const bar = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    const onClick = (event: MouseEvent) => { if (!bar.current?.contains(event.target as Node)) setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [menuOpen]);

  const links = (row: boolean) => <>
    <MainButton variant="custom" size="none" href="#how-it-works" className={row ? `${link} justify-start py-2` : link} onClick={row ? () => setMenuOpen(false) : undefined}>
      {t.landing.howItWorks}
    </MainButton>
    <MainButton variant="custom" size="none" href="#pricing" className={row ? `${link} justify-start py-2` : link} onClick={row ? () => setMenuOpen(false) : undefined}>
      {t.landing.pricingLink}
    </MainButton>
    <MainButton variant="custom" size="none" href={ROUTES.login} className={row ? `${link} justify-start py-2` : link}>
      {t.landing.login}
    </MainButton>
  </>;

  return (
    <nav ref={bar} aria-label={t.landing.navAria}
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 border-b px-4 py-4 text-xs text-white transition-all duration-300 motion-reduce:transition-none sm:px-6 sm:text-sm ${
        isScrolled || menuOpen
          ? "border-white/15 bg-black/55 shadow-lg shadow-black/10 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-transparent backdrop-blur-none"
      }`}>
      <MainButton variant="custom" size="none" href="#mainContainer" aria-label={t.landing.backToTop}
        className="shrink-0 gap-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:gap-2">
        <Image src="/brand/my-wedding-day-mark-knot.png" alt="My Wedding Day" width={48} height={48} priority className="size-12" />
        <span className="libre-font whitespace-nowrap text-lg font-extralight sm:text-l">myweddingday.</span>
      </MainButton>

      {/* Tablet and up. */}
      <div className="flex items-center gap-4 max-sm:hidden sm:gap-8 lg:gap-12">
        {links(false)}
        <LanguageSwitch />
      </div>

      {/* Phones: one button that opens the menu below. */}
      <button type="button" aria-expanded={menuOpen} aria-controls={menuId} aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
        onClick={() => setMenuOpen((open) => !open)}
        className="grid size-10 place-items-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white sm:hidden">
        {menuOpen ? <FiX aria-hidden="true" className="size-5" /> : <FiMenu aria-hidden="true" className="size-5" />}
      </button>
      <AnimatePresence>
        {menuOpen && <motion.div id={menuId} key="menu"
          className="absolute inset-x-0 top-full flex flex-col gap-1 border-b border-white/15 bg-black/80 px-5 pb-5 pt-2 text-sm backdrop-blur-xl sm:hidden"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, transition: { duration: 0.12 } }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>
          {links(true)}
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/15 pt-3">
            <span>{t.language.label}</span>
            <LanguageSwitch />
          </div>
        </motion.div>}
      </AnimatePresence>
    </nav>
  );
}
