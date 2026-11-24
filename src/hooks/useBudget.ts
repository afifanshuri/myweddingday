"use client";

import { useEffect, useState } from "react";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import { APIGetSelectedPackages } from "@/services/api/account";
import { getBudgetSummary } from "@/services/others/budgetService";
import { usePreferenceStore } from "@/store/preferenceStore";
import type { SelectedPackage } from "@/types/preferenceTypes";

/**
 * The budget from the plan's chosen packages, with current vendor and package names and prices from the server.
 * Shared by the results page's budget panel and the dashboard, so both behave the same:
 * - Every signed-in account has a budget (Plus for any vendor; free accounts for the vendors their free search unlocked).
 * - While the server confirms the current choices, what's already known is shown (no drop to zero in between).
 * - Packages that no longer exist are removed from the plan, with a count for a notice; packages this account can't
 *   see right now ("locked", e.g. after Plus ends) stay in the plan, just not shown.
 * Loaded once per page view and whenever the choices change; prices update the next time the page loads.
 */
export function useBudget() {
  const details = usePreferenceStore((state) => state.weddingDetails);
  const preferences = usePreferenceStore((state) => state.preferencesList);
  const savedPackages = usePreferenceStore((state) => state.selectedPackages);
  const { access, checking, revision } = useAccountAccess();
  const signedIn = !checking && !!access.userId;
  const ids = JSON.stringify(savedPackages.map((pkg) => pkg.packageId));
  const key = `${revision}:${ids}`;
  const [resolved, setResolved] = useState<{ key: string; packages: SelectedPackage[]; locked: number[] } | null>(null);
  const [removedCount, setRemovedCount] = useState(0);

  useEffect(() => {
    if (!signedIn || ids === "[]") return;
    const controller = new AbortController();
    APIGetSelectedPackages(ids, controller.signal)
      .then(({ packages, locked }) => {
        if (controller.signal.aborted) return;
        // Drop selections whose package was deleted (or whose vendor moved to another service), and say so.
        const requested: number[] = JSON.parse(ids);
        const store = usePreferenceStore.getState();
        const missing = store.selectedPackages.filter((saved) => requested.includes(saved.packageId) && !locked.includes(saved.packageId)
          && !packages.some((pkg) => pkg.packageId === saved.packageId && pkg.serviceId === saved.serviceId));
        if (missing.length) {
          missing.forEach((saved) => store.removeSelectedPackage(saved.serviceId));
          setRemovedCount((count) => count + missing.length);
        }
        setResolved({ key, packages, locked });
      }).catch(() => { if (!controller.signal.aborted) setResolved(null); });
    // The last answer is kept while the next one loads (see below), so totals don't drop to zero in between.
    return () => controller.abort();
  }, [signedIn, ids, key]);

  // Until the server confirms the current choices, show what's already known: confirmed packages from the last answer,
  // and newly chosen ones at the price shown when they were chosen.
  const packages = !signedIn ? [] : resolved?.key === key ? resolved.packages
    : savedPackages.filter((saved) => !resolved?.locked.includes(saved.packageId))
      .map((saved) => resolved?.packages.find((pkg) => pkg.packageId === saved.packageId && pkg.serviceId === saved.serviceId) ?? saved);

  return {
    signedIn,
    ...getBudgetSummary(details.services, preferences, packages, details.pax),
    removedCount,
    dismissRemoved: () => setRemovedCount(0),
  };
}
