"use client";

import { useState, useSyncExternalStore } from "react";
import { useBudget } from "@/hooks/useBudget";
import { ROUTES } from "@/config/routes";
import MainButton from "@/components/commonComponents/MainButton";
import { usePreferenceStore } from "@/store/preferenceStore";
import { SERVICE_ID } from "@/config/serviceCriteria";
import { useSelectedServices } from "@/hooks/useSelectedServices";
import { BsTrash } from "react-icons/bs";
import { FiArrowUpRight, FiChevronDown } from "react-icons/fi";
import { openVendorPage } from "@/store/vendorView";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";
import { AnimatedMoney, BudgetBar, money } from "@/components/commonComponents/BudgetMotion";
import { serviceIcon } from "@/components/commonComponents/serviceIcons";

const currency = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
const subscribe = () => () => {};

export default function BudgetSection() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  // Chosen services start collapsed (icon, service, price); tapping one shows its vendor and package.
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const toggle = (serviceId: number) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(serviceId)) next.delete(serviceId); else next.add(serviceId);
    return next;
  });
  const details = usePreferenceStore((state) => state.weddingDetails);
  // Loading, totals and the "no longer available" count are shared with the dashboard (useBudget).
  const { signedIn: unlocked, selections, plannedSen, selectedSen, remainingSen, removedCount, dismissRemoved } = useBudget();
  const removePackage = usePreferenceStore((state) => state.removeSelectedPackage);
  const services = useSelectedServices();
  const reduceMotion = useReducedMotion();

  return (
    <aside aria-labelledby="budget-heading" className="p-4 sm:p-8 xl:pl-0">
      <div className="rounded-xl border border-(--tertiary) bg-white p-5">
        <h2 id="budget-heading" className="libre-font text-xl text-(--positive-tertiary)">Your wedding budget</h2>
        {!mounted ? <LoadingScreen label="Loading your saved selections…" backdrop={false} /> : (
          <>
            <p className="mt-2 text-xs text-foreground/60">{unlocked ? `${selections.length} of ${details.services.length} services selected` : "Sign in to build your budget."}</p>
            {unlocked && removedCount > 0 && (
              <p role="status" className="mt-3 rounded-lg border border-(--tertiary) p-3 text-xs">
                {removedCount === 1 ? "A package you selected is" : `${removedCount} packages you selected are`} no longer available, so {removedCount === 1 ? "it was" : "they were"} removed from your budget.
                <button type="button" className="ml-2 underline" onClick={dismissRemoved}>Dismiss</button>
              </p>
            )}
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div className="min-w-0">
                <dt className="text-xs text-foreground/60">Planned budget</dt>
                <dd className="mt-1 break-words text-sm font-semibold">{plannedSen === null ? "Not set yet" : <AnimatedMoney sen={plannedSen} />}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-foreground/60">{remainingSen !== null && remainingSen < 0 ? "Over budget" : "Remaining budget"}</dt>
                <dd className={`mt-1 break-words text-sm font-semibold ${remainingSen !== null && remainingSen < 0 ? "text-red-600" : "text-(--positive-tertiary)"}`}>
                  {remainingSen === null ? "Not available yet" : <AnimatedMoney sen={Math.abs(remainingSen)} />}
                </dd>
              </div>
              <div className="col-span-2 rounded-xl border border-(--positive-secondary) bg-(--positive)/20 p-4 text-(--positive-tertiary)">
                <dt className="text-xs">Selected package total</dt>
                <dd className="libre-font mt-2 break-words text-2xl">{selectedSen === null ? "Guest count needed" : <AnimatedMoney sen={selectedSen} />}</dd>
              </div>
            </dl>
            {plannedSen !== null && selectedSen !== null && (
              <BudgetBar plannedSen={plannedSen} selectedSen={selectedSen} className="mt-4" />
            )}
            <p className="sr-only" role="status">
              {selections.length} packages selected. Estimated total {selectedSen === null ? "needs a guest count" : money(selectedSen)}.
              {remainingSen !== null && ` ${remainingSen < 0 ? "Over budget" : "Remaining"}: ${money(Math.abs(remainingSen))}.`}
            </p>
            {(plannedSen === null || selectedSen === null) && (
              <div className="mt-4 text-xs leading-5 text-foreground/65">
                <p>Complete your service budgets and guest count to see the full budget comparison.</p>
                <MainButton href={ROUTES.weddingPlan} variant="link" size="small">Edit wedding details</MainButton>
              </div>
            )}
            {details.services.length === 0 ? (
              <p className="py-6 text-sm leading-6 text-foreground/65">Choose your wedding services to start building your budget.</p>
            ) : (
              <ul className="mt-5">
                {/* Services with a chosen package first (in plan order), then the rest, greyed out. Rows glide when they move. */}
                {[...details.services].sort((a, b) => Number(!selections.some((item) => item.serviceId === a))
                  - Number(!selections.some((item) => item.serviceId === b))).map((serviceId, index) => {
                  const pkg = selections.find((item) => item.serviceId === serviceId);
                  const Icon = serviceIcon(serviceId);
                  const name = services.find((service) => service.id === serviceId)?.serviceName
                    ?? pkg?.serviceName ?? `Service ${serviceId}`;
                  return (
                  <motion.li key={serviceId} layout={reduceMotion ? false : "position"}
                    animate={{ opacity: pkg ? 1 : 0.55 }}
                    transition={{ layout: { type: "spring", stiffness: 420, damping: 36 }, opacity: { duration: reduceMotion ? 0 : 0.3 } }}
                    className={`py-3 ${index === 0 ? "pt-0" : "border-t border-(--secondary)"}`}>
                    {pkg ? <>
                      <div className="flex items-center gap-1">
                        {/* Collapsed: icon, service and price. Tap to show the vendor and package. */}
                        <button type="button" onClick={() => toggle(serviceId)} aria-expanded={expanded.has(serviceId)}
                          aria-controls={`budget-details-${serviceId}`}
                          className="grid min-w-0 flex-1 grid-cols-[2.25rem_minmax(0,1fr)_0.875rem] items-center gap-2 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary)">
                          <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg bg-(--secondary) text-(--positive-tertiary) transition-colors duration-300">
                            <Icon className="size-6" />
                          </span>
                          {/* Service on one line, its package price underneath. */}
                          <span className="flex min-w-0 flex-col">
                            <span className="whitespace-nowrap text-xs font-semibold text-(--positive-tertiary)">{name}</span>
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span key={`${pkg.packageId}:${pkg.costSen}`} className="whitespace-nowrap text-sm font-semibold"
                                initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                                {pkg.costSen === null ? "Pending" : money(pkg.costSen)}
                              </motion.span>
                            </AnimatePresence>
                          </span>
                          <FiChevronDown aria-hidden="true" className={`size-3.5 text-foreground/50 transition-transform duration-200 motion-reduce:transition-none ${expanded.has(serviceId) ? "rotate-180" : ""}`} />
                        </button>
                        <MainButton variant="ghost" size="icon" className="shrink-0" onClick={() => removePackage(serviceId)}
                          aria-label={`Remove ${pkg.packageName} from budget`} title="Remove package">
                          <BsTrash aria-hidden="true" />
                        </MainButton>
                      </div>
                      <AnimatePresence initial={false}>
                        {expanded.has(serviceId) && (
                          <motion.div key="details" id={`budget-details-${serviceId}`} className="overflow-hidden"
                            initial={reduceMotion ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
                            <div className="pl-11 pt-2">
                              {/* Opens this vendor's page in the results, the same view as clicking its card. */}
                              <button type="button" onClick={() => openVendorPage(pkg.vendorId)} title={`View ${pkg.vendorName || "this vendor"}`}
                                className="group block w-full rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary)">
                                <span className="block wrap-break-word text-xs font-medium underline-offset-4 group-hover:underline">{pkg.vendorName || "Loading…"}</span>
                                <span className="mt-0.5 flex items-center gap-1 wrap-break-word text-xs text-foreground/60 group-hover:text-(--positive-tertiary)">
                                  {pkg.packageName}
                                  <FiArrowUpRight aria-hidden="true" className="size-3 shrink-0" />
                                </span>
                              </button>
                              {pkg.serviceId === SERVICE_ID.CATERING && (
                                <p className="mt-0.5 text-xs text-foreground/60">{currency.format(pkg.unitPrice)} × {details.pax > 0 ? `${details.pax} guests` : "guest count needed"}</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </> : (
                      <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-stretch gap-2">
                        <span aria-hidden="true" className="relative rounded-lg bg-stone-100 text-stone-400 transition-colors duration-300">
                          <Icon className="absolute inset-0 h-full w-full p-1.5" />
                        </span>
                        <div className="flex min-h-9 min-w-0 flex-col justify-center gap-0.5">
                          <p className="whitespace-nowrap text-xs font-semibold text-foreground/60">{name}</p>
                          <p className="break-words text-xs text-foreground/50">No package chosen</p>
                        </div>
                      </div>
                    )}
                  </motion.li>
                  );
                })}
              </ul>
            )}
            <p className="mt-4 border-t border-(--secondary) pt-4 text-xs leading-5 text-foreground/50">Saved to your account. Totals cover selected packages only and are estimates, not bookings or confirmed vendor prices.</p>
          </>
        )}
      </div>
    </aside>
  );
}
