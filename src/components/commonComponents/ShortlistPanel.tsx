"use client";
import { useT } from "@/i18n";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FiX } from "react-icons/fi";
import { useAccountAccess } from "./AccountAccessProvider";
import MainButton from "./MainButton";
import ShortlistSection from "@/components/matchComponents/ShortlistSection";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useServiceStore } from "@/store/serviceStore";
import { closeShortlistPanel, loadShortlistDetails, onShortlistHistory, resetShortlistPanel, useShortlistPanel } from "@/store/shortlistDetails";
import { WEDDING_PLAN } from "@/config/weddingPlan";

/**
 * The shortlist, sliding in from the right over any signed-in page (opened from the top bar or the dashboard).
 * Its open state lives in memory (useShortlistPanel), never in the address, so it only opens when the user opens it;
 * browser Back still closes it (see shortlistDetails.ts). Shortlisted vendors' details are loaded in the background as
 * soon as a page opens, so the panel shows them at once.
 */
export default function ShortlistPanel() {
  const { access, checking, revision } = useAccountAccess();
  const isOpen = useShortlistPanel((state) => state.open);
  const pathname = usePathname();
  const shortlist = usePreferenceStore((state) => state.shortlist);
  const ids = shortlist.map((entry) => entry.vendorId);
  const idsKey = JSON.stringify(ids);
  const owner = access.userId ? `${access.userId}:${revision}` : null;
  const reduceMotion = useReducedMotion();
  const t = useT();
  const closeButton = useRef<HTMLButtonElement>(null);
  const catalogueLoaded = useServiceStore((state) => state.isLoaded);
  const initServices = useServiceStore((state) => state.initServices);

  const close = closeShortlistPanel;

  // Browser Back (or Forward) closes what sits above the history entry reached; it never opens the panel.
  useEffect(() => {
    const onPop = (event: PopStateEvent) => onShortlistHistory(event.state);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // Moving to another page closes it.
  useEffect(() => resetShortlistPanel, [pathname]);

  // Preload: shortly after a page opens (so its own content loads first), and whenever the shortlist changes or the
  // panel opens, load details that are missing or stale. Fresh ones are reused, so this is usually no request at all.
  useEffect(() => {
    if (checking || !owner || access.role === "admin" || idsKey === "[]") return;
    const timer = setTimeout(() => void loadShortlistDetails(owner, JSON.parse(idsKey)), isOpen ? 0 : 800);
    return () => clearTimeout(timer);
  }, [checking, owner, access.role, idsKey, isOpen]);

  // Service names for shortlisted vendors outside the plan.
  useEffect(() => {
    if (isOpen && !catalogueLoaded) void initServices().catch(() => {});
  }, [isOpen, catalogueLoaded, initServices]);

  // While open: Escape closes, the page behind doesn't scroll, and focus moves into the panel (and back after).
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [isOpen, close]);

  if (checking || !owner || access.role === "admin") return null;
  return <AnimatePresence>
    {isOpen && <>
      <motion.div key="backdrop" aria-hidden="true" className="fixed inset-0 z-40 bg-black/30" onClick={close}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} />
      <motion.aside key="panel" role="dialog" aria-modal="true" aria-labelledby="shortlist-panel-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-(--background) shadow-2xl sm:max-w-xl"
        initial={reduceMotion ? { opacity: 0 } : { x: "100%" }} animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }}>
        <div className="flex items-center justify-between gap-3 border-b border-(--tertiary) px-5 py-4">
          <div>
            <h2 id="shortlist-panel-title" className="libre-font text-2xl text-(--positive-tertiary)">{t.shortlist.title}</h2>
            <p className="text-xs text-foreground/60">{t.shortlist.count(shortlist.length, WEDDING_PLAN.maxShortlist)}</p>
          </div>
          <MainButton ref={closeButton} variant="ghost" size="icon" onClick={close} aria-label={t.shortlist.close} title={t.shortlist.closeTitle}>
            <FiX aria-hidden="true" />
          </MainButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <ShortlistSection owner={owner} />
        </div>
      </motion.aside>
    </>}
  </AnimatePresence>;
}
