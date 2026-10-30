"use client";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useSelectedServices } from "@/hooks/useSelectedServices";
import AllMatchSection from "@/components/matchComponents/AllMatchSection";
import TopMatchSection from "@/components/matchComponents/TopMatchSection";
import { useEffect, useState } from "react";
import { APIGetVendorsByPreferences } from "@/services/api/vendors";
import { VendorMatchResult } from "@/types/dtoTypes";
import VendorPackagesView from "@/components/matchComponents/VendorPackagesView";
import MatchLoading from "@/components/matchComponents/MatchLoading";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import MainButton from "@/components/commonComponents/MainButton";
import { ROUTES, paymentRoute } from "@/config/routes";

export default function VendorSection() {
  const { access, checking, revision } = useAccountAccess();
  const [result, setResult] = useState<{
    matches: VendorMatchResult[];
    revision: number;
    error: string | null;
    loading: boolean;
  }>({ matches: [], error: null, loading: true, revision: -1 });
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);
  const matches = result.revision === revision && !checking ? result.matches : [];
  const selectedMatch = matches.find((match) => match.vendor.id === selectedVendorId);
  const selectedServices = usePreferenceStore(
    (state) => state.weddingDetails.services,
  );
  const selectedLocations = usePreferenceStore(
    (state) => state.weddingDetails.locations,
  );
  const preferences = usePreferenceStore((state) => state.preferencesList);
  const servicesList = useSelectedServices();

  useEffect(() => {
    if (checking) return;
    const controller = new AbortController();
    const loadMatches = async () => {
      try {
        setSelectedVendorId(null);
        setResult({ matches: [], error: null, loading: true, revision });
        const preferencesList = preferences
          .filter((preference) =>
            selectedServices.includes(preference.serviceId),
          )
          .map((preference) => ({
            serviceId: preference.serviceId,
            budget: preference.budget,
            criteria: preference.criteria,
            requiredFields: preference.requiredFields ?? [],
            location: selectedLocations,
          }));
        const retrievedMatches =
          preferencesList.length > 0 && access.userId
            ? await APIGetVendorsByPreferences(preferencesList,
              usePreferenceStore.getState().getManualSearchId(JSON.stringify(preferencesList), access.userId), controller.signal)
            : null;

        if (!controller.signal.aborted) {
          setResult({ matches: retrievedMatches?.matches ?? [], error: null, loading: false, revision });
          window.dispatchEvent(new Event("manual-search-complete"));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        window.dispatchEvent(new Event("manual-search-complete"));
        setResult({
          matches: [],
          error: error instanceof Error ? error.message : "Unable to load your matches. Please try again.",
          loading: false,
          revision,
        });
      }
    };
    loadMatches();
    return () => {
      controller.abort();
      setSelectedVendorId(null);
      setResult({ matches: [], error: null, loading: true, revision: -1 });
    };
  }, [preferences, selectedLocations, selectedServices, checking, revision, access.userId, retry]);

  // Keep the API's matching order and take its first vendor for each service.
  const seenServices = new Set<number>();
  const topMatches = matches.filter((match) => {
    if (seenServices.has(match.vendor.serviceId)) return false;
    seenServices.add(match.vendor.serviceId);
    return true;
  });
  const otherMatches = matches.filter((match) => !topMatches.some((top) => top.vendor.id === match.vendor.id));
  const topServices = access.canViewVendorIdentity ? servicesList
    : servicesList.filter((service) => topMatches.some((match) => match.vendor.serviceId === service.id));

  return (
    <div
      className="flex min-w-0 flex-col gap-6 p-4 sm:p-8"
      aria-busy={result.loading}
    >
      {checking || result.revision !== revision || result.loading ? (
        <MatchLoading />
      ) : result.error ? (
        <div className="flex flex-col items-start gap-3"><p role="alert">{result.error}</p>
          <MainButton size="small" variant="secondary" onClick={() => setRetry((value) => value + 1)}>Try again</MainButton>
          {!access.isPaid && access.role !== "admin" && <MainButton size="small" href={paymentRoute()}>View Plus</MainButton>}
        </div>
      ) : selectedServices.length === 0 ? (
        <p>Select your services in the wedding plan to see vendor matches.</p>
      ) : selectedMatch && !selectedMatch.identityLocked && access.canViewVendorIdentity ? (
        <VendorPackagesView match={selectedMatch} onBack={() => setSelectedVendorId(null)} />
      ) : (
        <>
          {!access.canViewVendorIdentity && <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-(--tertiary) bg-white p-4 text-sm">
            <p>Preview all matching vendors for free. Plus unlocks vendor names, contacts, and packages.</p>
            <MainButton href={access.userId ? paymentRoute() : ROUTES.login} size="small">{access.userId ? "Unlock vendor details" : "Sign in to continue"}</MainButton>
          </div>}
          <TopMatchSection matches={topMatches} servicesList={topServices} onSelect={setSelectedVendorId} />
          {otherMatches.length > 0 && <AllMatchSection
            matches={otherMatches}
            topMatches={topMatches}
            servicesList={servicesList}
            onSelect={setSelectedVendorId}
          />}
        </>
      )}
    </div>
  );
}
