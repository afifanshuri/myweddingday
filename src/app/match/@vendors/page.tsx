"use client";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useServiceStore } from "@/store/serviceStore";
import AllMatchSection from "@/components/matchComponents/AllMatchSection";
import TopMatchSection from "@/components/matchComponents/TopMatchSection";
import { useEffect, useState } from "react";
import { retrieveVendorsByPreference } from "@/services/vendorService";
import { VendorAndPackagesMatchDTOType } from "@/types/dtoTypes";
import VendorPackagesView from "@/components/matchComponents/VendorPackagesView";

export default function VendorSection() {
  const [result, setResult] = useState<{
    matches: VendorAndPackagesMatchDTOType[];
    error: string | null;
    loading: boolean;
  }>({ matches: [], error: null, loading: true });
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const matches = result.matches;
  const selectedMatch = matches.find((match) => match.vendor.id === selectedVendorId);
  const selectedServices = usePreferenceStore(
    (state) => state.weddingDetails.services,
  );
  const selectedLocations = usePreferenceStore(
    (state) => state.weddingDetails.locations,
  );
  const preferences = usePreferenceStore((state) => state.preferencesList);
  const services = useServiceStore((state) => state.service);
  const servicesList = selectedServices.map(
    (id) =>
      services.find((service) => service.id === id) ?? {
        id,
        serviceName: `Service ${id}`,
      },
  );

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setResult({ matches: [], error: null, loading: true });
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
          preferencesList.length > 0
            ? await retrieveVendorsByPreference(preferencesList)
            : [];
        setResult({ matches: retrievedMatches, error: null, loading: false });
      } catch {
        setResult({
          matches: [],
          error: "Unable to load your matches. Please try again.",
          loading: false,
        });
      }
    };
    loadMatches();
  }, [preferences, selectedLocations, selectedServices]);

  // Keep the API's matching order and take its first vendor for each service.
  const seenServices = new Set<number>();
  const topMatches = matches.filter((match) => {
    if (seenServices.has(match.vendor.serviceId)) return false;
    seenServices.add(match.vendor.serviceId);
    return true;
  });

  return (
    <div
      className="flex min-w-0 flex-col gap-6 p-4 sm:p-8"
      aria-busy={result.loading}
    >
      {result.loading ? (
        <p role="status">Finding your vendor matches...</p>
      ) : result.error ? (
        <p role="alert">{result.error}</p>
      ) : selectedServices.length === 0 ? (
        <p>Select your services in the wedding plan to see vendor matches.</p>
      ) : selectedMatch ? (
        <VendorPackagesView match={selectedMatch} onBack={() => setSelectedVendorId(null)} />
      ) : (
        <>
          <TopMatchSection matches={topMatches} servicesList={servicesList} onSelect={setSelectedVendorId} />
          <AllMatchSection
            matches={matches}
            topMatches={topMatches}
            servicesList={servicesList}
            onSelect={setSelectedVendorId}
          />
        </>
      )}
    </div>
  );
}
