"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePreferenceStore } from "@/store/preferenceStore";
import { VscDebugRestart, VscListFlat } from "react-icons/vsc";
import MainButton from "@/components/commonComponents/MainButton";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import { useFreeSearchUsed } from "@/store/searchUsage";
import { ROUTES, paymentRoute } from "@/config/routes";
import { useT } from "@/i18n";

const subscribe = () => () => {};

/** A small card under its button; closes on Escape or a click outside `box`. */
function Popover({ open, onClose, box, labelledBy, children }: { open: boolean; onClose: () => void; box: RefObject<HTMLDivElement | null>; labelledBy: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    const onClick = (event: MouseEvent) => { if (!box.current?.contains(event.target as Node)) onClose(); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open, onClose, box]);

  return <AnimatePresence>
    {open && <motion.div role="dialog" aria-labelledby={labelledBy}
      className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-(--tertiary) bg-white p-4 text-left text-sm shadow-lg"
      initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>}
  </AnimatePresence>;
}

/**
 * Results toolbar, under the account bar. "Edit preferences" returns to the planner with everything kept (details,
 * criteria, shortlist, chosen packages). A free account that has used its one search can't change preferences or
 * search again: the button offers Plus instead. "Reset" clears every chosen package after a confirmation; the plan
 * itself (services, budgets, criteria) is kept.
 */
export function Navbar() {
  const { access, checking } = useAccountAccess();
  const t = useT();
  const freeSearchUsed = useFreeSearchUsed(access, checking);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const selections = usePreferenceStore((state) => state.selectedPackages);
  const clearSelectedPackages = usePreferenceStore((state) => state.clearSelectedPackages);
  const [open, setOpen] = useState<"plus" | "reset" | null>(null);
  const close = () => setOpen(null);
  const editBox = useRef<HTMLDivElement>(null);
  const resetBox = useRef<HTMLDivElement>(null);
  const canReset = mounted && !checking && !!access.userId && selections.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 px-4 pt-4 text-(--positive-tertiary) sm:px-8 xl:px-10">
      <div ref={editBox} className="relative">
        {freeSearchUsed
          ? <MainButton variant="secondary" size="small" aria-haspopup="dialog" aria-expanded={open === "plus"} onClick={() => setOpen(open === "plus" ? null : "plus")}>
            <VscListFlat aria-hidden="true" />
            <span>{t.results.editPreferences}</span>
          </MainButton>
          : <MainButton variant="secondary" size="small" href={ROUTES.weddingPlan}>
            <VscListFlat aria-hidden="true" />
            <span>{t.results.editPreferences}</span>
          </MainButton>}
        <Popover open={open === "plus"} onClose={close} box={editBox} labelledBy="edit-preferences-prompt">
          <p id="edit-preferences-prompt" className="font-semibold">{t.results.usedFreeSearchTitle}</p>
          <p className="mt-1 leading-6 text-foreground/70">{t.results.usedFreeSearchText}</p>
          <div className="mt-4 flex justify-end gap-2">
            <MainButton variant="ghost" size="small" onClick={close}>{t.common.notNow}</MainButton>
            <MainButton size="small" href={paymentRoute()}>{t.common.getPlus}</MainButton>
          </div>
        </Popover>
      </div>
      {canReset && <div ref={resetBox} className="relative">
        <MainButton variant="secondary" size="small" aria-haspopup="dialog" aria-expanded={open === "reset"} onClick={() => setOpen(open === "reset" ? null : "reset")}>
          <VscDebugRestart aria-hidden="true" />
          <span>{t.results.reset}</span>
        </MainButton>
        <Popover open={open === "reset"} onClose={close} box={resetBox} labelledBy="reset-prompt">
          <p id="reset-prompt" className="font-semibold">{t.results.resetTitle}</p>
          <p className="mt-1 leading-6 text-foreground/70">
            {t.results.resetText(selections.length)}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <MainButton variant="ghost" size="small" onClick={close}>{t.common.cancel}</MainButton>
            <MainButton variant="danger" size="small" onClick={() => { clearSelectedPackages(); close(); }}>{t.results.removeAll}</MainButton>
          </div>
        </Popover>
      </div>}
    </div>
  );
}
