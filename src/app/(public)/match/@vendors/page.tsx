"use client";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useSelectedServices } from "@/hooks/useSelectedServices";
import AllMatchSection from "@/components/matchComponents/AllMatchSection";
import TopMatchSection from "@/components/matchComponents/TopMatchSection";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { APIGetVendorsByPreferences, APIGetSavedSearch, APIGetSearchVendor, SearchRequestError } from "@/services/api/vendors";
import type { VendorDetailedMatch } from "@/types/dtoTypes";
import type { ManualSearchResult } from "@/types/search";
import VendorPackagesView from "@/components/matchComponents/VendorPackagesView";
import MatchLoading from "@/components/matchComponents/MatchLoading";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import MainButton from "@/components/commonComponents/MainButton";
import { ROUTES, paymentRoute } from "@/config/routes";
import { SEARCH } from "@/config/plans";

export default function VendorSection() {
  const { access, checking, revision } = useAccountAccess();
  const [result, setResult] = useState<{ data: ManualSearchResult | null; revision: number }>({ data: null, revision: -1 });
  const [detail, setDetail] = useState<{ match: VendorDetailedMatch; revision: number } | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [error, setError] = useState<{ message: string; expired: boolean } | null>(null);
  const [page, setPage] = useState(1);
  const [serviceFilter, setServiceFilter] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);
  const [detailRetry, setDetailRetry] = useState(0);
  const lastImageRetry = useRef(0);
  const [busy, setBusy] = useState(true);
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
        if (saved?.pending && saved.createdAt && Date.now() - saved.createdAt >= SEARCH.lifetimeMs) {
          usePreferenceStore.getState().completeManualSearch(searchId);
          throw new SearchRequestError("Your search results have expired. Your planning preferences are saved. Plan again to start a new search.", 410);
        }
        if (saved?.pending) {
          next = await APIGetVendorsByPreferences(preferencesList, searchId, controller.signal);
          usePreferenceStore.getState().completeManualSearch(searchId);
        } else next = await APIGetSavedSearch(searchId, page, controller.signal, serviceFilter);
        if (!controller.signal.aborted) {
          setResult({ data: next, revision });
          setError(null);
          window.dispatchEvent(new Event("manual-search-complete"));
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          const expired = cause instanceof SearchRequestError && cause.status === 410;
          if (expired) { setResult({ data: null, revision }); setDetail(null); }
          setError({ message: cause instanceof Error ? cause.message : "Unable to load your matches.", expired });
          window.dispatchEvent(new Event("manual-search-complete"));
        }
      } finally { inFlight = false; if (!controller.signal.aborted) setBusy(false); }
    };
    // Vendor details load once per page view (and on page/filter changes). There is no background
    // reload: changes made while the page is open appear the next time it loads.
    void load();
    return () => controller.abort();
  }, [preferences, selectedLocations, selectedServices, checking, revision, access.userId, retry, page, serviceFilter]);

  useEffect(() => {
    if (!data) return;
    const expire = () => {
      setError({ message: "Your search results have expired. Your planning preferences are saved. Plan again to start a new search.", expired: true });
      setResult({ data: null, revision });
      setDetail(null);
      setSelectedVendorId(null);
    };
    const remaining = Date.parse(data.expiresAt) - Date.now();
    if (remaining <= 0) { expire(); return; }
    const timer = window.setTimeout(expire, remaining);
    return () => window.clearTimeout(timer);
  }, [data, revision]);

  useEffect(() => {
    if (checking || !access.canViewVendorIdentity || selectedVendorId === null || !searchId) return;
    const controller = new AbortController();
    const load = () => APIGetSearchVendor(searchId, selectedVendorId, controller.signal)
      .then((match) => { if (!controller.signal.aborted) setDetail({ match, revision }); })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setDetail(null); setSelectedVendorId(null);
          setError({ message: cause instanceof Error ? cause.message : "Unable to load vendor details.", expired: cause instanceof SearchRequestError && cause.status === 410 });
        }
      });
    void load();
    return () => controller.abort();
  }, [selectedVendorId, searchId, checking, revision, access.canViewVendorIdentity, detailRetry]);

  // Photo links are signed for an hour. If one fails (usually because the page has been open that long),
  // reload the current view once for fresh links. At most once every 5 minutes, so a missing file can't loop.
  const onImageError = (event: SyntheticEvent) => {
    if (!(event.target instanceof HTMLImageElement) || Date.now() - lastImageRetry.current < 5 * 60 * 1000) return;
    lastImageRetry.current = Date.now();
    if (selectedVendorId !== null) setDetailRetry((value) => value + 1);
    else setRetry((value) => value + 1);
  };

  const topMatches = data?.topMatches ?? [];
  const otherMatches = data?.matches ?? [];
  const topServices = servicesList.filter((service) => topMatches.some((match) => match.vendor.serviceId === service.id));
  const selectVendor = (id: number) => { setError(null); setDetail(null); setSelectedVendorId(id); };
  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-8" aria-busy={busy} onErrorCapture={onImageError}>
      {checking || (busy && !data) ? <MatchLoading /> : error ? (
        <div className="flex flex-col items-start gap-3">
          <p role="alert">{error.message}</p>
          <MainButton size="small" href={ROUTES.weddingPlan}>Plan again</MainButton>
          {!error.expired && <MainButton size="small" variant="secondary" onClick={() => { setError(null); setRetry((value) => value + 1); }}>Try again</MainButton>}
        </div>
      ) : selectedServices.length === 0 ? <p>Select your services in the wedding plan to see vendor matches.</p>
        : selectedVendorId !== null && access.canViewVendorIdentity ? (
          selectedMatch ? <VendorPackagesView match={selectedMatch} onBack={() => { setDetail(null); setSelectedVendorId(null); }} /> : <MatchLoading />
        ) : data ? <>
          {!access.canViewVendorIdentity && <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-(--tertiary) bg-white p-4 text-sm">
            <p>Preview all matching vendors for free. Plus unlocks vendor names, contacts, and packages.</p>
            <MainButton href={paymentRoute()} size="small">Unlock vendor details</MainButton>
          </div>}
          <p className="text-xs text-(--positive-tertiary)">Results saved until {new Date(data.expiresAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })} (Malaysia time). Vendor details and prices are current as of when this page loaded; ranking reflects your original search.</p>
          <TopMatchSection matches={topMatches} servicesList={topServices} onSelect={selectVendor} />
          {(data.total > 0 || serviceFilter !== null) && <AllMatchSection matches={otherMatches} topMatches={topMatches} servicesList={servicesList} onSelect={selectVendor} activeServiceId={serviceFilter} onServiceChange={(id) => { setServiceFilter(id); setPage(1); }} />}
          {data.pageCount > 1 && <nav aria-label="Vendor results pages" className="flex items-center justify-center gap-4">
            <MainButton size="small" variant="secondary" disabled={busy || data.page <= 1} onClick={() => setPage(data.page - 1)}>Previous</MainButton>
            <span aria-live="polite">Page {data.page} of {data.pageCount}</span>
            <MainButton size="small" variant="secondary" disabled={busy || data.page >= data.pageCount} onClick={() => setPage(data.page + 1)}>Next</MainButton>
          </nav>}
        </> : <p>Plan your wedding to find vendors.</p>}
    </div>
  );
}
