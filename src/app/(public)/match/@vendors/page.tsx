"use client";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useSelectedServices } from "@/hooks/useSelectedServices";
import AllMatchSection from "@/components/matchComponents/AllMatchSection";
import TopMatchSection from "@/components/matchComponents/TopMatchSection";
import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";
import { APIGetShortlist } from "@/services/api/account";
import { registerVendorOpener } from "@/store/vendorView";
import { APIGetVendorsByPreferences, APIGetSavedSearch, APIGetSearchVendor, SearchRequestError } from "@/services/api/vendors";
import type { VendorDetailedMatch } from "@/types/dtoTypes";
import type { ManualSearchResult } from "@/types/search";
import VendorPackagesView from "@/components/matchComponents/VendorPackagesView";
import MatchLoading from "@/components/matchComponents/MatchLoading";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import MainButton from "@/components/commonComponents/MainButton";
import { ROUTES, paymentRoute } from "@/config/routes";
import { SEARCH } from "@/config/plans";
import { useHistoryParam } from "@/hooks/useHistoryParam";
import { useFreeSearchUsed } from "@/store/searchUsage";
import { useT } from "@/i18n";

// How long a loaded results page is shown without checking the server again.
const PAGE_CACHE_FRESH_MS = 2 * 60 * 1000;

export default function VendorSection() {
  const { access, checking, revision } = useAccountAccess();
  const [result, setResult] = useState<{ data: ManualSearchResult | null; revision: number; filter?: number | null }>({ data: null, revision: -1 });
  const [detail, setDetail] = useState<{ match: VendorDetailedMatch; revision: number; all?: boolean } | null>(null);
  // The open vendor is kept in the address (?vendor=), so the browser Back button returns to the results.
  const [selectedVendorId, openVendor, closeVendor] = useHistoryParam("vendor");
  const [error, setError] = useState<{ message: string; expired: boolean; upgrade?: boolean } | null>(null);
  const [page, setPage] = useState(1);
  const [serviceFilter, setServiceFilter] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);
  const [detailRetry, setDetailRetry] = useState(0);
  const lastImageRetry = useRef(0);
  // Result pages loaded while this page is open (see the loading effect), and the last "Try again" seen.
  const pageCache = useRef(new Map<string, { data: ManualSearchResult; at: number }>());
  const seenRetry = useRef(0);
  const [busy, setBusy] = useState(true);
  const freeSearchUsed = useFreeSearchUsed(access, checking);
  const t = useT();
  const selectedServices = usePreferenceStore((state) => state.weddingDetails.services);
  const selectedLocations = usePreferenceStore((state) => state.weddingDetails.locations);
  const preferences = usePreferenceStore((state) => state.preferencesList);
  const servicesList = useSelectedServices();
  const data = !checking && result.revision === revision ? result.data : null;
  const selectedMatch = !checking && detail?.revision === revision && detail.match.vendor.id === selectedVendorId ? detail.match : null;
  const searchId = data?.searchId;

  useEffect(() => {
    if (checking) return;
    const controller = new AbortController();
    let inFlight = false;
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      setBusy(true);
      try {
        const preferencesList = preferences.filter((preference) => selectedServices.includes(preference.serviceId))
          .map((preference) => ({ serviceId: preference.serviceId, budget: preference.budget, criteria: preference.criteria,
            requiredFields: preference.requiredFields ?? [], location: selectedLocations }));
        if (!preferencesList.length || !access.userId) {
          if (!controller.signal.aborted) setBusy(false);
          return;
        }
        const store = usePreferenceStore.getState();
        const input = JSON.stringify(preferencesList);
        if (!store.manualSearchRequested && (!store.manualSearch || store.manualSearch.input !== input || store.manualSearch.userId !== access.userId)) {
          throw new SearchRequestError("Plan your wedding and submit your preferences to start a new search.", 410);
        }
        const searchId = store.getManualSearchId(input, access.userId);
        // Only a newly submitted search may POST. Saved searches always use GET,
        // including after cleanup, so a refresh can never silently consume allowance.
        let next: ManualSearchResult;
        const saved = usePreferenceStore.getState().manualSearch;
        // Pages already loaded show at once. A fresh one (under 2 minutes old) is used as is; an older one is
        // shown while the current version loads in the background. "Try again" always goes to the server.
        const cacheKey = `${revision}:${searchId}:${serviceFilter ?? "all"}:${page}`;
        const bypass = retry !== seenRetry.current;
        seenRetry.current = retry;
        const hit = saved?.pending || bypass ? undefined : pageCache.current.get(cacheKey);
        if (hit) {
          setResult({ data: hit.data, revision, filter: serviceFilter });
          setError(null);
          if (Date.now() - hit.at < PAGE_CACHE_FRESH_MS) return;
        }
        if (saved?.pending && saved.createdAt && Date.now() - saved.createdAt >= SEARCH.lifetimeMs) {
          usePreferenceStore.getState().completeManualSearch(searchId);
          throw new SearchRequestError("Your search results have expired. Your planning preferences are saved. Plan again to start a new search.", 410);
        }
        if (saved?.pending) {
          next = await APIGetVendorsByPreferences(preferencesList, searchId, controller.signal);
          usePreferenceStore.getState().completeManualSearch(searchId);
        } else next = await APIGetSavedSearch(searchId, page, controller.signal, serviceFilter);
        if (!controller.signal.aborted) {
          const filter = saved?.pending ? null : serviceFilter;
          pageCache.current.set(`${revision}:${searchId}:${filter ?? "all"}:${saved?.pending ? 1 : page}`, { data: next, at: Date.now() });
          setResult({ data: next, revision, filter });
          setError(null);
          window.dispatchEvent(new Event("manual-search-complete"));
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          const expired = cause instanceof SearchRequestError && cause.status === 410;
          const upgrade = cause instanceof SearchRequestError && cause.status === 403;
          if (expired) { pageCache.current.clear(); setResult({ data: null, revision }); setDetail(null); }
          setError({ message: cause instanceof Error ? cause.message : "Unable to load your matches.", expired, upgrade });
          window.dispatchEvent(new Event("manual-search-complete"));
        }
      } finally { inFlight = false; if (!controller.signal.aborted) setBusy(false); }
    };
    // Each page/filter loads once, then comes from pageCache (refreshed when over 2 minutes old). Cached pages are
    // keyed by access revision and search, so upgrading, signing out or a new search never reuses them.
    void load();
    return () => controller.abort();
  }, [preferences, selectedLocations, selectedServices, checking, revision, access.userId, retry, page, serviceFilter]);

  useEffect(() => {
    if (!data) return;
    const expire = () => {
      setError({ message: "Your search results have expired. Your planning preferences are saved. Plan again to start a new search.", expired: true });
      setResult({ data: null, revision });
      setDetail(null);
      closeVendor();
    };
    const remaining = Date.parse(data.expiresAt) - Date.now();
    if (remaining <= 0) { expire(); return; }
    const timer = window.setTimeout(expire, remaining);
    return () => window.clearTimeout(timer);
  }, [data, revision, closeVendor]);

  useEffect(() => {
    // Only vendors this account was shown in its results open (Plus in full; free only those its free search
    // unlocked). The server checks, so typing another ID in ?vendor= shows "no longer available".
    if (checking || !access.userId || selectedVendorId === null) return;
    // Wait for the search to load, unless there isn't one (expired or never run).
    if (!searchId && busy) return;
    const controller = new AbortController();
    // A vendor outside this search (e.g. budgeted from the shortlist, or the search expired) opens with all its
    // packages, through the same route as the shortlist.
    const allPackages = async () => {
      const { vendors } = await APIGetShortlist([selectedVendorId], controller.signal);
      const match = vendors[0];
      if (!match) throw new SearchRequestError("This vendor is no longer available.", 404);
      if (match.identityLocked) throw new SearchRequestError("Get Plus to see this vendor's details", 403);
      return match as VendorDetailedMatch;
    };
    const load = async () => {
      try {
        let next: { match: VendorDetailedMatch; all: boolean };
        try {
          if (!searchId) throw new SearchRequestError("No current search", 410);
          next = { match: await APIGetSearchVendor(searchId, selectedVendorId, controller.signal), all: false };
        } catch (cause) {
          if (!(cause instanceof SearchRequestError) || (cause.status !== 404 && cause.status !== 410)) throw cause;
          next = { match: await allPackages(), all: true };
        }
        if (!controller.signal.aborted) setDetail({ ...next, revision });
      } catch (cause) {
        if (!controller.signal.aborted) {
          setDetail(null); closeVendor();
          setError({ message: cause instanceof Error ? cause.message : "Unable to load vendor details.",
            expired: false, upgrade: cause instanceof SearchRequestError && cause.status === 403 });
        }
      }
    };
    void load();
    return () => controller.abort();
  }, [selectedVendorId, searchId, busy, checking, revision, access.userId, detailRetry, closeVendor]);

  // Photo links are signed for an hour. If one fails (usually because the page has been open that long),
  // reload the current view once for fresh links. At most once every 5 minutes, so a missing file can't loop.
  const onImageError = (event: SyntheticEvent) => {
    if (!(event.target instanceof HTMLImageElement) || Date.now() - lastImageRetry.current < 5 * 60 * 1000) return;
    lastImageRetry.current = Date.now();
    if (selectedVendorId !== null) setDetailRetry((value) => value + 1);
    else setRetry((value) => value + 1);
  };

  // Top picks always show every service. The service filter applies only to the list below, at once
  // (before the filtered page arrives from the server).
  const topMatches = data?.topMatches ?? [];
  const otherMatches = (data?.matches ?? []).filter((match) => serviceFilter === null || match.vendor.serviceId === serviceFilter);
  const topServices = servicesList.filter((service) => topMatches.some((match) => match.vendor.serviceId === service.id));
  const selectVendor = useCallback((id: number) => { setError(null); setDetail(null); openVendor(id); }, [openVendor]);
  // Lets the budget panel open a vendor's page here.
  useEffect(() => {
    registerVendorOpener(selectVendor);
    return () => registerVendorOpener(null);
  }, [selectVendor]);
  // A different page is on its way: show placeholder cards (as for a filter change), not the old page's vendors.
  const pageLoading = !!data && busy && data.page !== page;
  const goToPage = (next: number) => {
    setPage(next);
    // The page buttons are at the bottom; bring the top of the list into view so the new page is seen from its start.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("all-match-heading")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-8" aria-busy={busy} onErrorCapture={onImageError}>
      {checking ? <MatchLoading />
        : selectedVendorId !== null && !error ? (
          selectedMatch ? <VendorPackagesView match={selectedMatch} fromShortlist={detail?.all}
            onBack={() => { setDetail(null); closeVendor(); }} /> : <MatchLoading />
        ) : busy && !data ? <MatchLoading /> : error ? (
        <div className="flex flex-col items-start gap-3">
          <p role="alert">{t.errors[error.message] ?? error.message}</p>
          {error.upgrade || freeSearchUsed
            ? <MainButton size="small" href={paymentRoute()}>{freeSearchUsed ? t.results.getPlusToSearch : t.common.getPlus}</MainButton>
            : <MainButton size="small" href={ROUTES.weddingPlan}>{t.results.planAgain}</MainButton>}
          {!error.expired && !error.upgrade && <MainButton size="small" variant="secondary" onClick={() => { setError(null); setRetry((value) => value + 1); }}>{t.results.tryAgain}</MainButton>}
        </div>
      ) : selectedServices.length === 0 ? <p>{t.results.noServices}</p>
        : data ? <>
          {!access.canViewVendorIdentity && <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-(--tertiary) bg-white p-4 text-sm">
            <p>{t.results.freeBanner}</p>
            <MainButton href={paymentRoute()} size="small">{t.common.getPlus}</MainButton>
          </div>}
          <TopMatchSection matches={topMatches} servicesList={topServices} onSelect={selectVendor} />
          {(data.total > 0 || data.lockedCount > 0 || serviceFilter !== null) && <AllMatchSection matches={otherMatches} lockedCount={data.lockedCount} topMatches={topMatches} servicesList={servicesList} onSelect={selectVendor} activeServiceId={serviceFilter} loading={result.filter !== serviceFilter || pageLoading} onServiceChange={(id) => { setServiceFilter(id); setPage(1); }} />}
          {data.pageCount > 1 && <nav aria-label={t.results.pagesAria} className="flex items-center justify-center gap-4">
            <MainButton size="small" variant="secondary" disabled={busy || data.page <= 1} onClick={() => goToPage(data.page - 1)}>{t.results.previous}</MainButton>
            <span aria-live="polite">{t.results.pageOf(data.page, data.pageCount)}</span>
            <MainButton size="small" variant="secondary" disabled={busy || data.page >= data.pageCount} onClick={() => goToPage(data.page + 1)}>{t.results.next}</MainButton>
          </nav>}
        </> : <p>{t.results.planToFind}</p>}
    </div>
  );
}
