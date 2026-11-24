"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

const currency = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
export const money = (sen: number) => currency.format(sen / 100);
const EASE = [0.22, 1, 0.36, 1] as const;

/** An amount in sen that counts to its new value when it changes (instantly for reduced motion). */
export function AnimatedMoney({ sen, className = "" }: { sen: number; className?: string }) {
  const reduce = useReducedMotion();
  const value = useMotionValue(sen);
  const text = useTransform(value, (current) => money(Math.round(current)));
  useEffect(() => {
    if (reduce) { value.set(sen); return; }
    const controls = animate(value, sen, { duration: 0.7, ease: EASE });
    return () => controls.stop();
  }, [sen, reduce, value]);
  // Screen readers get the final amount; the counting digits are visual only.
  return <span className={className}>
    <motion.span aria-hidden="true" className="tabular-nums">{text}</motion.span>
    <span className="sr-only">{money(sen)}</span>
  </span>;
}

/** Selected packages as a share of the planned budget. Grows when a package is chosen and turns red when over budget. */
export function BudgetBar({ plannedSen, selectedSen, className = "" }: { plannedSen: number; selectedSen: number; className?: string }) {
  const reduce = useReducedMotion();
  const share = plannedSen > 0 ? Math.min(1, selectedSen / plannedSen) : 0;
  const over = selectedSen > plannedSen;
  return <div role="progressbar" aria-label="Selected packages as a share of planned budget"
    aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share * 100)}
    aria-valuetext={over ? `Over budget by ${money(selectedSen - plannedSen)}` : `${Math.round(share * 100)}% of planned budget`}
    className={`h-2 w-full overflow-hidden rounded-full bg-(--secondary) ${className}`}>
    <motion.div className={`h-full origin-left rounded-full ${over ? "bg-red-600" : "bg-(--positive-tertiary)"}`}
      initial={false} animate={{ scaleX: share }} style={{ width: "100%" }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 22 }} />
  </div>;
}
