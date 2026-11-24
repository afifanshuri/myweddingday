"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePreferenceStore } from "@/store/preferenceStore";
import { VscListFlat } from "react-icons/vsc";
import MainButton from "@/components/commonComponents/MainButton";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import { useFreeSearchUsed } from "@/store/searchUsage";
import { ROUTES, paymentRoute } from "@/config/routes";

/**
 * Results header. "Edit preferences" returns to the planner with everything kept (details, criteria, shortlist,
 * chosen packages); there is no button that wipes the plan. A free account that has used its one search can't
 * change preferences or search again: the button opens a short prompt offering Plus instead.
 */
export function Navbar() {
  const coupleName = usePreferenceStore((state) => state.weddingDetails.coupleName);
  const { access, checking } = useAccountAccess();
  const freeSearchUsed = useFreeSearchUsed(access, checking);
  const [prompt, setPrompt] = useState(false);
  const reduceMotion = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);

  // The prompt closes on Escape or a click outside it.
  useEffect(() => {
    if (!prompt) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setPrompt(false); };
    const onClick = (event: MouseEvent) => { if (!box.current?.contains(event.target as Node)) setPrompt(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [prompt]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 bg-(--positive) px-5 pb-5 pt-2 sm:flex-row sm:justify-between sm:px-8 xl:px-10">
      <p className="libre-font text-center text-xl text-white sm:text-left xl:text-2xl">
        Specially curated vendors for {coupleName || "your wedding"}
      </p>
      <div ref={box} className="relative text-(--positive-tertiary)">
        {freeSearchUsed
          ? <MainButton variant="secondary" size="small" aria-haspopup="dialog" aria-expanded={prompt} onClick={() => setPrompt((open) => !open)}>
            <VscListFlat aria-hidden="true" />
            <span>Edit preferences</span>
          </MainButton>
          : <MainButton variant="secondary" size="small" href={ROUTES.weddingPlan}>
            <VscListFlat aria-hidden="true" />
            <span>Edit preferences</span>
          </MainButton>}
        <AnimatePresence>
          {prompt && <motion.div role="dialog" aria-labelledby="edit-preferences-prompt"
            className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-(--tertiary) bg-white p-4 text-left text-sm shadow-lg"
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>
            <p id="edit-preferences-prompt" className="font-semibold">You&apos;ve used your free search</p>
            <p className="mt-1 leading-6 text-foreground/70">Get Plus to change your preferences and search again, with every match shown in full.</p>
            <div className="mt-4 flex justify-end gap-2">
              <MainButton variant="ghost" size="small" onClick={() => setPrompt(false)}>Not now</MainButton>
              <MainButton size="small" href={paymentRoute()}>Get Plus</MainButton>
            </div>
          </motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
}
