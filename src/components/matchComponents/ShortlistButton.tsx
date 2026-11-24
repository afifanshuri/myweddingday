"use client";

import { useState, type MouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { usePreferenceStore } from "@/store/preferenceStore";
import { WEDDING_PLAN } from "@/config/weddingPlan";

const FULL = `Your shortlist is full (${WEDDING_PLAN.maxShortlist}). Remove a vendor to add another.`;

/**
 * Keeps a vendor in view without choosing it. Shown as a bookmark, never as a tick or "In budget",
 * so it can't be mistaken for a package chosen for the budget.
 */
export default function ShortlistButton({ vendorId, serviceId, vendorLabel, variant = "icon" }: {
  vendorId: number; serviceId: number; vendorLabel: string; variant?: "icon" | "labelled";
}) {
  const listed = usePreferenceStore((state) => state.shortlist.some((entry) => entry.vendorId === vendorId));
  const toggle = usePreferenceStore((state) => state.toggleShortlist);
  const [full, setFull] = useState(false);
  const reduceMotion = useReducedMotion();
  const Icon = listed ? BsBookmarkFill : BsBookmark;

  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setFull(!toggle(vendorId, serviceId));
  };
  const label = listed ? `Remove ${vendorLabel} from your shortlist` : `Add ${vendorLabel} to your shortlist`;
  const icon = <motion.span key={String(listed)} aria-hidden="true" className="grid place-items-center"
    initial={reduceMotion ? false : { scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
    <Icon />
  </motion.span>;

  return <span className="relative inline-flex">
    {variant === "icon"
      ? <button type="button" onClick={onClick} aria-pressed={listed} aria-label={label} title={listed ? "Shortlisted" : "Shortlist"}
        className={`grid size-9 place-items-center rounded-full text-sm shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary) ${listed ? "bg-(--positive) text-(--positive-tertiary)" : "bg-white/90 text-(--positive-tertiary) hover:bg-white"}`}>
        {icon}
      </button>
      : <button type="button" onClick={onClick} aria-pressed={listed} aria-label={label}
        className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary) ${listed ? "border-(--positive-secondary) bg-(--positive)/40 text-(--positive-tertiary)" : "border-(--positive-secondary) text-(--positive-tertiary) hover:bg-(--secondary)"}`}>
        {icon}{listed ? "Shortlisted" : "Shortlist"}
      </button>}
    {full && <span role="alert" className="absolute right-0 top-full z-10 mt-2 w-60 rounded-lg border border-(--tertiary) bg-white p-3 text-left text-xs text-foreground shadow-sm">{FULL}</span>}
  </span>;
}
