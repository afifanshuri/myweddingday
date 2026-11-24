"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { useBudget } from "@/hooks/useBudget";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useAccountAccess } from "./AccountAccessProvider";
import { AnimatedMoney, BudgetBar, money } from "./BudgetMotion";
import { serviceIcon } from "./serviceIcons";
import { openShortlistPanel } from "@/store/shortlistDetails";
import { usePreferenceStore } from "@/store/preferenceStore";
import { usePlanStatus } from "@/store/planSync";
import { useFreeSearchUsed } from "@/store/searchUsage";
import { canViewIdentity } from "@/services/others/accessRules";
import { ROUTES, paymentRoute } from "@/config/routes";
import { SEARCH } from "@/config/plans";
import { planHasContent } from "@/config/weddingPlan";

type Named = { id: number; name: string };
const DAY = 24 * 60 * 60 * 1000;

// The current minute, so time-based text updates without reading the clock during render (0 before hydration).
const subscribeMinute = (notify: () => void) => { const timer = setInterval(notify, 30000); return () => clearInterval(timer); };
const currentMinute = () => Math.floor(Date.now() / 60000) * 60000;

const localDate = (value: string) => new Date(`${value}T00:00:00`);
const startOfDay = (time: number) => { const date = new Date(time); date.setHours(0, 0, 0, 0); return date.getTime(); };
const list = (items: string[]) => items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

function dateSentence(date: string | null, now: number) {
  if (!date) return "Your wedding date isn't set yet.";
  const day = localDate(date);
  const written = day.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  if (!now) return `${written}.`;
  const days = Math.round((day.getTime() - startOfDay(now)) / DAY);
  if (days > 1) return `${written}, in ${days.toLocaleString("en-MY")} days.`;
  if (days === 1) return `${written}, tomorrow.`;
  if (days === 0) return `${written}, today.`;
  return `${written}.`;
}

const cardLink = "inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive)";

/** The plum "invitation" that opens the dashboard: the couple, the date and where, framed like a printed card. */
function WeddingCard({ children }: { children: ReactNode }) {
  return <section aria-labelledby="wedding-names" className="rounded-[2rem] bg-(--positive-tertiary) p-2 text-(--secondary) sm:p-2.5">
    <div className="rounded-[1.6rem] border border-(--positive)/35 px-6 py-10 sm:px-12 sm:py-14">{children}</div>
  </section>;
}

/** The signed-in user's saved plan: the wedding, their chosen vendors and the budget. */
export default function DashboardPlan({ locations, services }: { locations: Named[]; services: Named[] }) {
  const { access, checking } = useAccountAccess();
  // Any signed-in account has a budget (free accounts for the vendors their free search unlocked); Plus sees every match.
  const unlocked = !checking && !!access.userId;
  const plus = !checking && canViewIdentity(access);
  // A free account that has used its one search can't change its plan or search again without Plus.
  const freeSearchUsed = useFreeSearchUsed(access, checking);
  const details = usePreferenceStore((state) => state.weddingDetails);
  const search = usePreferenceStore((state) => state.manualSearch);
  const shortlist = usePreferenceStore((state) => state.shortlist);
  const hasPlan = usePreferenceStore((state) => planHasContent(state));
  const { saving, failed } = usePlanStatus();
  const now = useSyncExternalStore(subscribeMinute, currentMinute, () => 0);
  const reduceMotion = useReducedMotion();

  // Loading, totals and the "no longer available" count are shared with the results page's budget panel.
  const { selections, plannedSen, selectedSen, remainingSen, removedCount, dismissRemoved } = useBudget();

  if (!hasPlan) {
    return <WeddingCard>
      <h1 id="wedding-names" className="libre-font max-w-[16ch] text-4xl leading-[1.1] text-white text-balance sm:text-6xl">Your wedding starts here</h1>
      <p className="mt-6 max-w-[52ch] text-base leading-7">Tell us the date, where and how many guests, then the services you need. We&apos;ll find vendors that fit, and keep your plan in your account.</p>
      <Link href={ROUTES.weddingPlan} className={`${cardLink} mt-8 bg-(--positive) text-(--positive-tertiary) hover:bg-white`}>Start your plan</Link>
    </WeddingCard>;
  }

  const serviceName = (id: number) => services.find((service) => service.id === id)?.name ?? details.serviceNames[id] ?? `Service ${id}`;
  const places = details.locations.flatMap((id) => locations.find((location) => location.id === id)?.name ?? []);
  const where = [places.length ? `In ${list(places)}` : "", details.pax > 0 ? `${places.length ? "for" : "For"} ${details.pax.toLocaleString("en-MY")} guests` : ""]
    .filter(Boolean).join(", ");
  const resultsUntil = search?.createdAt ? search.createdAt + SEARCH.lifetimeMs : null;
  const resultsReady = !!resultsUntil && now > 0 && resultsUntil > now;
  const chosen = selections.length;
  const saveState = failed ? "Not saved yet. Retrying." : saving ? "Saving…" : "Saved to your account";

  return <div className="space-y-10 sm:space-y-14">
    <WeddingCard>
      <p className="text-sm text-(--positive)">The wedding of</p>
      <h1 id="wedding-names" className="libre-font mt-3 max-w-[18ch] text-4xl leading-[1.08] text-white text-balance sm:text-6xl">
        {details.coupleName.trim() || "the two of you"}
      </h1>
      <p className="mt-6 text-lg leading-7">{dateSentence(details.date, now)}</p>
      {where && <p className="mt-1 text-base leading-7 text-(--positive)">{where}.</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        {resultsReady
          ? <Link href={ROUTES.match} className={`${cardLink} bg-(--positive) text-(--positive-tertiary) hover:bg-white`}>View your matches</Link>
          : freeSearchUsed
            ? <Link href={paymentRoute(ROUTES.dashboard)} className={`${cardLink} bg-(--positive) text-(--positive-tertiary) hover:bg-white`}>Get Plus to search again</Link>
            : <Link href={ROUTES.weddingPlan} className={`${cardLink} bg-(--positive) text-(--positive-tertiary) hover:bg-white`}>{search ? "Search again" : "Find vendors"}</Link>}
        {freeSearchUsed
          ? <span aria-disabled="true" title="Get Plus to change your plan and search again"
            className={`${cardLink} cursor-not-allowed border border-(--positive)/30 text-white/50`}>Edit plan</span>
          : <Link href={ROUTES.weddingPlan} className={`${cardLink} border border-(--positive)/60 text-white hover:bg-white/10`}>Edit plan</Link>}
      </div>
      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-(--positive)/30 pt-5 text-sm">
        <p>{!search ? "You haven't searched for vendors yet."
          : resultsReady ? `Your matches are ready until ${new Date(resultsUntil!).toLocaleString("en-MY", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}.`
          : "Your last matches have expired. Your plan is kept, so you can search again."}</p>
        <p role="status" className={`text-xs ${failed ? "text-white" : "text-(--positive)"}`}>{saveState}</p>
      </div>
    </WeddingCard>

    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
      <section aria-labelledby="dashboard-vendors">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-(--tertiary) pb-4">
          <h2 id="dashboard-vendors" className="libre-font text-2xl text-(--positive-tertiary)">Your vendors</h2>
          {details.services.length > 0 && <p className="text-sm text-foreground/60">{unlocked ? `${chosen} of ${details.services.length} chosen` : `${details.services.length} services`}</p>}
        </div>
        {removedCount > 0 && <p role="status" className="mt-4 rounded-xl border border-(--tertiary) px-4 py-3 text-sm leading-6">
          {removedCount === 1 ? "A package you chose is" : `${removedCount} packages you chose are`} no longer available, so {removedCount === 1 ? "it was" : "they were"} removed from your budget.
          <button type="button" className="ml-2 underline" onClick={dismissRemoved}>Dismiss</button>
        </p>}
        {!plus && details.services.length > 0 && <p className="mt-4 rounded-xl bg-(--secondary) px-4 py-3 text-sm leading-6">
          Your free search shows one vendor per service in full, and you can choose their packages. Plus unlocks every match. <Link href={paymentRoute(ROUTES.dashboard)} className="font-medium text-(--positive-tertiary) underline underline-offset-4">Get Plus</Link>
        </p>}
        {details.services.length === 0
          ? <p className="py-6 text-sm leading-6 text-foreground/65">You haven&apos;t chosen any services yet. <Link href={ROUTES.weddingPlan} className="font-medium text-(--positive-tertiary) underline underline-offset-4">Choose services</Link></p>
          : <ul className="divide-y divide-(--secondary)">
            {details.services.map((id) => {
              const pkg = selections.find((item) => item.serviceId === id);
              const listed = shortlist.filter((entry) => entry.serviceId === id).length;
              const Icon = serviceIcon(id);
              return <li key={id} className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-4 py-4">
                <span aria-hidden="true" className={`grid size-11 place-items-center rounded-full ${pkg ? "bg-(--positive-tertiary) text-(--positive)" : "bg-(--secondary) text-(--positive-tertiary)"}`}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-(--positive-tertiary)">{serviceName(id)}</p>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.p key={pkg?.packageId ?? "none"} className={`truncate text-sm ${pkg ? "" : "text-foreground/50"}`}
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                      {pkg ? `${pkg.vendorName}, ${pkg.packageName}` : listed ? <>Not chosen yet, <button type="button" onClick={openShortlistPanel}
                        className="font-medium text-(--positive-tertiary) underline underline-offset-4">{listed} shortlisted</button></> : "Not chosen yet"}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <p className="libre-font text-right text-base text-(--positive-tertiary)">
                  {pkg ? (pkg.costSen === null ? <span className="font-sans text-xs text-foreground/60">Needs guest count</span> : money(pkg.costSen))
                    : unlocked && resultsReady ? <Link href={ROUTES.match} className="font-sans text-sm font-medium underline underline-offset-4">Choose</Link> : null}
                </p>
              </li>;
            })}
          </ul>}
      </section>

      <aside aria-labelledby="dashboard-budget" className="lg:sticky lg:top-8 lg:self-start">
        <h2 id="dashboard-budget" className="libre-font border-b border-(--tertiary) pb-4 text-2xl text-(--positive-tertiary)">Budget</h2>
        {plannedSen === null
          ? <p className="mt-4 text-sm leading-6 text-foreground/65">Set a budget for each service and your guest count to see totals.{!freeSearchUsed && <> <Link href={ROUTES.weddingPlan} className="font-medium text-(--positive-tertiary) underline underline-offset-4">Edit plan</Link></>}</p>
          : unlocked && selectedSen !== null ? <div className="mt-5">
            <p className="libre-font text-4xl text-(--positive-tertiary)"><AnimatedMoney sen={selectedSen} /></p>
            <p className="mt-1 text-sm text-foreground/65">chosen so far, of {money(plannedSen)} planned</p>
            <BudgetBar plannedSen={plannedSen} selectedSen={selectedSen} className="mt-5" />
            {remainingSen !== null && <p className={`mt-3 text-sm font-medium ${remainingSen < 0 ? "text-red-700" : "text-(--positive-tertiary)"}`}>
              <AnimatedMoney sen={Math.abs(remainingSen)} /> {remainingSen < 0 ? "over budget" : "left to spend"}
            </p>}
          </div> : <div className="mt-5">
            <p className="libre-font text-4xl text-(--positive-tertiary)">{money(plannedSen)}</p>
            <p className="mt-1 text-sm text-foreground/65">planned across {details.services.length} {details.services.length === 1 ? "service" : "services"}</p>
          </div>}
        <div className="mt-8 border-t border-(--tertiary) pt-5 text-sm leading-6">
          {access.role === "admin" ? <p>Admin account. Every vendor detail is visible.</p>
            : access.isPaid ? <p>Plus pass{access.paidUntil ? ` until ${new Date(access.paidUntil).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}` : ""}.</p>
            : <p>Free account. Plus shows every vendor&apos;s details and lets you choose packages for a year. <Link href={paymentRoute(ROUTES.dashboard)} className="font-medium text-(--positive-tertiary) underline underline-offset-4">Get Plus</Link></p>}
          <p className="mt-3 text-xs text-foreground/50">Totals are estimates from the packages you chose, not bookings.</p>
        </div>
      </aside>
    </div>
  </div>;
}
