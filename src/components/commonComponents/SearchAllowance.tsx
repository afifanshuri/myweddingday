"use client";

import { useEffect, useState } from "react";
import { useAccountAccess } from "./AccountAccessProvider";
import { APIGetSearchUsage } from "@/services/api/searchUsage";
import Link from "next/link";
import { PLANS } from "@/config/plans";
import { paymentRoute } from "@/config/routes";
import { useSearchUsage } from "@/store/searchUsage";
import type { SearchUsage } from "@/types/search";
import { useT } from "@/i18n";

export default function SearchAllowance() {
  const { access, checking, revision } = useAccountAccess();
  const [usage, setUsage] = useState<SearchUsage | null>(null);
  const [error, setError] = useState(false);
  const t = useT();
  useEffect(() => {
    if (checking || !access.userId) return;
    const controller = new AbortController();
    let generation = 0;
    async function refresh() {
      const current = ++generation;
      try {
        const next = await APIGetSearchUsage(controller.signal);
        if (!controller.signal.aborted && current === generation) {
          setUsage(next); setError(false);
          useSearchUsage.setState({ userId: access.userId, usage: next });
        }
      } catch { if (!controller.signal.aborted && current === generation) setError(true); }
    }
    const onFocus = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    const interval = setInterval(onFocus, 60000);
    window.addEventListener("focus", onFocus);
    window.addEventListener("manual-search-complete", onFocus);
    return () => {
      controller.abort(); clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("manual-search-complete", onFocus);
    };
  }, [access.userId, checking, revision]);

  if (checking || !access.userId) return null;
  if (access.role === "admin") return <p className="text-xs text-foreground/60">{t.allowance.unlimited}</p>;
  if (access.isPaid) return <p className="text-xs text-foreground/60">{t.allowance.plusPlan}</p>;
  return <p role="status" className="text-xs text-foreground/60">
    {error ? t.allowance.unavailable
      : !usage ? t.allowance.checking
        : usage.remaining ? t.allowance.freeAvailable(PLANS.free.manualSearches)
          : <>{t.allowance.freeUsed} · <Link href={paymentRoute()} className="font-medium text-(--positive-tertiary) underline underline-offset-2">{t.common.getPlus}</Link> {t.allowance.toSearchAgain}</>}
  </p>;
}
