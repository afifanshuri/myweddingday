"use client";
import { useT } from "@/i18n";

import { ServiceType } from "@/types/dataTypes";
import { VendorMatchResult } from "@/types/dtoTypes";
import VendorContainer from "./VendorContainer";
import { serviceIcon } from "@/components/commonComponents/serviceIcons";

export default function TopMatchSection({
  matches,
  servicesList,
  onSelect,
}: {
  matches: VendorMatchResult[];
  servicesList: Pick<ServiceType, "id" | "serviceName">[];
  onSelect: (vendorId: number) => void;
}) {
  const t = useT();
  return (
    <section
      aria-labelledby="top-match-heading"
      className="min-w-0 rounded-lg border border-(--secondary) bg-white p-4 sm:p-6"
    >
      <h2 id="top-match-heading" className="libre-font text-lg">
        {t.results.bestPicks}
      </h2>
      {/* Padding keeps a chosen card's glow from being clipped by the scrolling row. */}
      <div className="-mx-2 mt-3 flex gap-4 overflow-x-auto px-2 pb-3 pt-2">
        {servicesList.map((service) => {
          const match = matches.find(
            (item) => item.vendor.serviceId === service.id,
          );
          const Icon = serviceIcon(service.id);
          return (
            <div key={service.id} className="flex w-64 shrink-0 flex-col gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-(--positive-tertiary)">
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-lg bg-(--secondary)"
                >
                  <Icon className="size-4" />
                </span>
                {service.serviceName}
              </h3>
              {match ? (
                <VendorContainer
                  match={match}
                  serviceName={service.serviceName}
                  topPick
                  onSelect={onSelect}
                />
              ) : (
                <div className="flex-1 rounded-lg border border-dashed border-(--tertiary) p-4">
                  <p className="text-sm font-normal">
                    {t.results.noMatchForService}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
