"use client";

import { useEffect, useState } from "react";
import { useAccountAccess } from "./AccountAccessProvider";
import { APIGetSearchUsage } from "@/services/api/searchUsage";
import { PLANS } from "@/config/plans";
import type { SearchUsage } from "@/types/search";

export default function SearchAllowance() {
  const { access, checking, revision } = useAccountAccess();
  const [usage, setUsage] = useState<SearchUsage | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (checking || !access.userId) return;
    const controller = new AbortController();
    let generation = 0;
    async function refresh() {
      const current = ++generation;
      try {
        const next = await APIGetSearchUsage(controller.signal);
        if (!controller.signal.aborted && current === generation) { setUsage(next); setError(false); }
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
  if (access.role === "admin" || access.isPaid) return <p className="text-xs text-foreground/60">Unlimited manual searches</p>;
  return <p role="status" className="text-xs text-foreground/60">
    {error ? "Search allowance unavailable. It will be checked when you search."
      : usage ? `${usage.remaining} of ${PLANS.free.manualSearchesPerDay} searches left today · Resets at midnight (Malaysia)`
        : "Checking search allowance…"}
  </p>;
}
