"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { FiAlertCircle, FiArrowRight, FiCalendar, FiCloudOff, FiEdit2, FiLock, FiSearch, FiX } from "react-icons/fi";
import { BsBookmark } from "react-icons/bs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useBudget } from "@/hooks/useBudget";
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
import { serviceName as displayServiceName, useT } from "@/i18n";

type Named = { id: number; name: string };
const DAY = 24 * 60 * 60 * 1000;

// The current minute, so time-based text updates without reading the clock during render (0 before hydration).
const subscribeMinute = (notify: () => void) => { const timer = setInterval(notify, 30000); return () => clearInterval(timer); };
const currentMinute = () => Math.floor(Date.now() / 60000) * 60000;
const startOfDay = (time: number) => { const date = new Date(time); date.setHours(0, 0, 0, 0); return date.getTime(); };

/** Whole days from today to the wedding; null before hydration. */
function daysUntil(date: string, now: number) {
  if (!now) return null;
  return Math.round((new Date(`${date}T00:00:00`).getTime() - startOfDay(now)) / DAY);
}

const button = "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary)";
const primary = `${button} bg-(--positive-tertiary) text-white hover:bg-(--positive-tertiary)/90`;
const secondary = `${button} border border-(--tertiary) bg-white text-(--positive-tertiary) hover:bg-(--secondary)`;
const disabled = `${button} cursor-not-allowed border border-(--tertiary) text-foreground/40`;

function Card({ title, icon, children, aside }: { title: string; icon: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return <section aria-label={title} className="rounded-2xl border border-(--tertiary) bg-white p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/55">{icon}{title}</h2>
      {aside}
    </div>
    {children}
  </section>;
}

/** The signed-in user's saved plan: the wedding, the latest results, the budget and the chosen vendors. */
export default function DashboardPlan({ services }: { services: Named[] }) {
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
  const { failed } = usePlanStatus();
  const now = useSyncExternalStore(subscribeMinute, currentMinute, () => 0);
  const reduceMotion = useReducedMotion();
  const t = useT();

  // Loading, totals and the "no longer available" count are shared with the results page's budget panel.
  const { selections, plannedSen, selectedSen, remainingSen, removedCount, dismissRemoved, unavailable } = useBudget();

  if (!hasPlan) {
    return <section className="rounded-2xl border border-(--tertiary) bg-white px-6 py-12 text-center">
      <h1 className="libre-font text-2xl text-(--positive-tertiary)">{t.dashboard.emptyTitle}</h1>
      <p className="mx-auto mt-2 max-w-[40ch] text-sm text-foreground/60">{t.dashboard.emptyText}</p>
      <Link href={ROUTES.weddingPlan} className={`${primary} mt-6`}>{t.dashboard.start} <FiArrowRight aria-hidden="true" /></Link>
    </section>;
  }

  const serviceName = (id: number) => displayServiceName(t, id, services.find((service) => service.id === id)?.name ?? details.serviceNames[id]);
  const resultsUntil = search?.createdAt ? search.createdAt + SEARCH.lifetimeMs : null;
  const resultsReady = !!resultsUntil && now > 0 && resultsUntil > now;
  const chosen = selections.length;
  const days = details.date ? daysUntil(details.date, now) : null;
  const daysLeft = days === null || days < 0 ? null : days === 0 ? t.dashboard.today : days === 1 ? t.dashboard.tomorrow : t.dashboard.daysLeft(days.toLocaleString(t.intl));
  const savedUntil = (time: number) => new Date(time).toLocaleString(t.intl, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });

  return <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
      <div className="min-w-0">
        <h1 className="libre-font truncate text-2xl text-(--positive-tertiary) sm:text-3xl">{details.coupleName.trim() || t.dashboard.yourWedding}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground/60">
          <FiCalendar aria-hidden="true" className="size-4" />
          {details.date
            ? <>{new Date(`${details.date}T00:00:00`).toLocaleDateString(t.intl, { day: "numeric", month: "long", year: "numeric" })}
              {daysLeft && <span className="rounded-full bg-(--secondary) px-2 py-0.5 text-xs font-medium text-(--positive-tertiary)">{daysLeft}</span>}</>
            : t.dashboard.dateNotSet}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Saving happens quietly; only a failed save is worth showing. */}
        <span role="status" className="text-xs text-red-700">
          {failed && <span className="inline-flex items-center gap-1.5"><FiCloudOff aria-hidden="true" className="size-4" /> {t.dashboard.notSaved}</span>}
        </span>
        {freeSearchUsed
          ? <span aria-disabled="true" title={t.dashboard.editLockedTitle} className={disabled}><FiLock aria-hidden="true" /> {t.dashboard.editPreferences}</span>
          : <Link href={ROUTES.weddingPlan} className={secondary}><FiEdit2 aria-hidden="true" /> {t.dashboard.editPreferences}</Link>}
      </div>
    </header>

    <div className="grid gap-5 sm:grid-cols-2">
      <Card title={t.dashboard.results} icon={<FiSearch aria-hidden="true" className="size-3.5" />}>
        {resultsReady
          ? <div className="flex flex-col gap-4">
            <div>
              <p className="libre-font text-xl text-(--positive-tertiary)">{t.dashboard.matchesReady}</p>
              <p className="mt-1 text-sm leading-6 text-foreground/60">{t.dashboard.savedUntil(savedUntil(resultsUntil!))}</p>
            </div>
            <Link href={ROUTES.match} className={`${primary} self-start`}>{t.dashboard.viewMatches} <FiArrowRight aria-hidden="true" /></Link>
          </div>
          : <div className="flex flex-col gap-4">
            <div>
              <p className="libre-font text-xl text-(--positive-tertiary)">{search ? t.dashboard.expiredTitle : t.dashboard.noSearchTitle}</p>
              <p className="mt-1 text-sm leading-6 text-foreground/60">{search
                ? freeSearchUsed ? t.dashboard.expiredFree : t.dashboard.expiredPlus
                : t.dashboard.noSearchText}</p>
            </div>
            {freeSearchUsed
              ? <Link href={paymentRoute(ROUTES.dashboard)} className={`${primary} self-start`}><FiLock aria-hidden="true" /> {t.common.getPlus}</Link>
              : <Link href={ROUTES.weddingPlan} className={`${primary} self-start`}>{search ? t.dashboard.searchAgain : t.dashboard.findVendors} <FiArrowRight aria-hidden="true" /></Link>}
          </div>}
        {!plus && details.services.length > 0 && <Link href={paymentRoute(ROUTES.dashboard)}
          className="mt-4 flex items-center gap-2 border-t border-(--secondary) pt-3 text-xs text-foreground/60 hover:text-(--positive-tertiary)">
          <FiLock aria-hidden="true" className="size-3.5" /> {t.dashboard.freeLine} <span className="font-medium underline underline-offset-4">{t.dashboard.unlockAll}</span>
        </Link>}
      </Card>

      <Card title={t.dashboard.budget} icon={<span aria-hidden="true" className="text-[0.7rem] font-bold">RM</span>}>
        {plannedSen === null
          ? <p className="text-sm text-foreground/60">{t.dashboard.budgetHint}</p>
          : unlocked && selectedSen !== null ? <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="libre-font text-2xl text-(--positive-tertiary)"><AnimatedMoney sen={selectedSen} /></p>
              <p className="text-xs text-foreground/55">{t.dashboard.of(money(plannedSen))}</p>
            </div>
            <BudgetBar plannedSen={plannedSen} selectedSen={selectedSen} className="mt-3" />
            {remainingSen !== null && <p className={`mt-2 text-xs font-medium ${remainingSen < 0 ? "text-red-700" : "text-foreground/60"}`}>
              <AnimatedMoney sen={Math.abs(remainingSen)} /> {remainingSen < 0 ? t.dashboard.over : t.dashboard.left}
            </p>}
          </> : <p className="libre-font text-2xl text-(--positive-tertiary)">{money(plannedSen)}</p>}
      </Card>
    </div>

    <Card title={t.dashboard.vendors} icon={<BsBookmark aria-hidden="true" className="size-3.5" />}
      aside={details.services.length > 0 && <span className="text-xs font-medium text-foreground/55">{chosen}/{details.services.length}</span>}>
      {removedCount > 0 && <p role="status" className="mb-3 flex items-center gap-2 rounded-xl bg-(--secondary) px-3 py-2 text-xs">
        <FiAlertCircle aria-hidden="true" className="size-4 shrink-0" />
        <span className="flex-1">{t.dashboard.removed(removedCount)}</span>
        <button type="button" aria-label={t.common.dismiss} onClick={dismissRemoved} className="grid size-7 place-items-center rounded-full hover:bg-white"><FiX aria-hidden="true" /></button>
      </p>}
      {details.services.length === 0
        ? <Link href={ROUTES.weddingPlan} className="text-sm font-medium text-(--positive-tertiary) underline underline-offset-4">{t.dashboard.chooseServices}</Link>
        : <ul className="-mx-2">
          {details.services.map((id) => {
            const pkg = selections.find((item) => item.serviceId === id);
            const off = pkg ? undefined : unavailable.find((item) => item.serviceId === id);
            const listed = shortlist.filter((entry) => entry.serviceId === id).length;
            const Icon = serviceIcon(id);
            const row = <>
              <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-full ${pkg ? "bg-(--positive-tertiary) text-(--positive)" : "bg-(--secondary) text-foreground/40"}`}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${pkg ? "text-(--positive-tertiary)" : "text-foreground/50"}`}>{serviceName(id)}</span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={pkg?.packageId ?? (off ? `off-${off.packageId}` : "none")} className="block truncate text-xs text-foreground/55"
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                    {pkg ? `${pkg.vendorName} · ${pkg.packageName}`
                      : off ? <><span className="font-medium text-amber-800">{t.budget.unavailable}</span>{off.vendorName ? ` · ${off.vendorName}` : ""}</> : "—"}
                  </motion.span>
                </AnimatePresence>
              </span>
            </>;
            return <li key={id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
              {pkg && resultsReady
                ? <Link href={`${ROUTES.match}?vendor=${pkg.vendorId}`} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80">{row}</Link>
                : <span className="flex min-w-0 flex-1 items-center gap-3">{row}</span>}
              <span className="shrink-0 text-right text-sm">
                {pkg ? (pkg.costSen === null ? <span className="text-xs text-foreground/50" title={t.dashboard.addGuests}>—</span>
                  : <span className="font-medium text-(--positive-tertiary)">{money(pkg.costSen)}</span>)
                  : listed ? <button type="button" onClick={openShortlistPanel} title={t.dashboard.openShortlist}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-(--secondary) px-2.5 py-1 text-xs font-medium text-(--positive-tertiary) hover:bg-(--tertiary)">
                    <BsBookmark aria-hidden="true" className="size-3" />{t.dashboard.shortlistedCount(listed)}</button>
                    : unlocked && resultsReady ? <Link href={ROUTES.match} className="text-xs font-medium text-(--positive-tertiary) underline underline-offset-4">{t.dashboard.choose}</Link> : null}
              </span>
            </li>;
          })}
        </ul>}
    </Card>
  </div>;
}
