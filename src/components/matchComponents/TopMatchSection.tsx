import { ServiceType } from "@/types/dataTypes";
import { VendorAndPackagesMatchDTOType } from "@/types/dtoTypes";
import VendorContainer from "./VendorContainer";

export default function TopMatchSection({ matches, servicesList, onSelect }: {
  matches: VendorAndPackagesMatchDTOType[];
  servicesList: Pick<ServiceType, "id" | "serviceName">[];
  onSelect: (vendorId: number) => void;
}) {
  return (
    <section aria-labelledby="top-match-heading" className="min-w-0 rounded-lg border border-(--secondary) bg-white p-4 sm:p-6">
      <h2 id="top-match-heading" className="libre-font text-lg">Best Picks Based on Your Preferences</h2>
      <p className="mt-2 text-sm font-normal">Your top match for each selected service.</p>
      <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
        {servicesList.map((service) => {
          const match = matches.find((item) => item.vendor.serviceId === service.id);
          return (
            <div key={service.id} className="w-64 shrink-0">
              {match ? (
                <VendorContainer match={match} serviceName={service.serviceName} topPick onSelect={onSelect} />
              ) : (
                <div className="h-full rounded-lg border border-dashed border-(--tertiary) p-4">
                  <h3 className="text-sm">{service.serviceName}</h3>
                  <p className="mt-3 text-sm font-normal">No matching vendors for this service.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
