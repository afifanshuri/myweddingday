"use client";
import MainButton from "@/components/commonComponents/MainButton";


import { ServiceType } from "@/types/dataTypes";
import { VendorMatchResult } from "@/types/dtoTypes";
import VendorContainer from "./VendorContainer";

export default function AllMatchSection({
  matches,
  topMatches,
  servicesList,
  onSelect,
  activeServiceId,
  onServiceChange,
}: {
  matches: VendorMatchResult[];
  topMatches: VendorMatchResult[];
  servicesList: Pick<ServiceType, "id" | "serviceName">[];
  onSelect: (vendorId: number) => void;
  activeServiceId: number | null;
  onServiceChange: (serviceId: number | null) => void;
}) {
  const visibleMatches = matches;
  const filters = [{ id: null, serviceName: "All services" }, ...servicesList];

  return (
    <section
      aria-labelledby="all-match-heading"
      className="min-w-0 rounded-lg border border-(--secondary) bg-white p-4 sm:p-6"
    >
      <h2 id="all-match-heading" className="libre-font text-lg">
        All Vendors
      </h2>
      <p className="mt-2 text-sm font-normal" aria-live="polite">
        {visibleMatches.length}{" "}
        {visibleMatches.length === 1 ? "vendor" : "vendors"} on this page
      </p>
      <div
        className="my-5 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter matches by service"
      >
        {filters.map((service) => (
          <MainButton variant="choice" size="small"
            key={service.id ?? "all"}
            type="button"
            aria-pressed={activeServiceId === service.id}
            onClick={() => onServiceChange(service.id)}
          >
            {service.serviceName}
          </MainButton>
        ))}
      </div>
      {visibleMatches.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleMatches.map((match) => (
            <VendorContainer
              key={match.vendor.id}
              match={match}
              onSelect={onSelect}
              serviceName={
                servicesList.find(
                  (service) => service.id === match.vendor.serviceId,
                )?.serviceName ?? "Service"
              }
              topPick={topMatches.some(
                (topMatch) => topMatch.vendor.id === match.vendor.id,
              )}
            />
          ))}
        </div>
      ) : (
        <p className="py-6 text-sm font-normal">
          No other vendors match this selection. Your best matches are shown
          above.
        </p>
      )}
    </section>
  );
}
