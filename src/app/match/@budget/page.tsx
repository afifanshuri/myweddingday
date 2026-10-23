"use client";

import { useSyncExternalStore } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import { usePreferenceStore } from "@/store/preferenceStore";
import { getBudgetSummary } from "@/services/others/budgetService";
import { SERVICE_ID } from "@/config/serviceCriteria";
import { useServiceStore } from "@/store/serviceStore";
import { BsTrash } from "react-icons/bs";
import { GiAmpleDress, GiFamilyHouse, GiForkKnifeSpoon, GiLipstick, GiPhotoCamera, GiSofa } from "react-icons/gi";

const serviceIcons = {
  [SERVICE_ID.VENUE]: GiFamilyHouse,
  [SERVICE_ID.PELAMIN]: GiSofa,
  [SERVICE_ID.CATERING]: GiForkKnifeSpoon,
  [SERVICE_ID.PHOTOGRAPHER]: GiPhotoCamera,
  [SERVICE_ID.CLOTHING]: GiAmpleDress,
  [SERVICE_ID.MUA]: GiLipstick,
};
const serviceNames: Record<number, string> = { 1: "Venue", 2: "Pelamin", 3: "Catering", 4: "Photography", 5: "Bridal attire", 6: "Makeup" };

const currency = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
const money = (sen: number) => currency.format(sen / 100);
const subscribe = () => () => {};

export default function BudgetSection() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const details = usePreferenceStore((state) => state.weddingDetails);
  const preferences = usePreferenceStore((state) => state.preferencesList);
  const packages = usePreferenceStore((state) => state.selectedPackages);
  const removePackage = usePreferenceStore((state) => state.removeSelectedPackage);
  const services = useServiceStore((state) => state.service);
  const { selections, plannedSen, selectedSen, remainingSen } = getBudgetSummary(details.services, preferences, packages, details.pax);

  return (
    <aside aria-labelledby="budget-heading" className="p-4 sm:p-8 xl:pl-0">
      <div className="rounded-xl border border-(--tertiary) bg-white p-5">
        <h2 id="budget-heading" className="libre-font text-xl text-(--positive-tertiary)">Your wedding budget</h2>
        {!mounted ? <p className="mt-4 text-sm">Loading your saved selections...</p> : (
          <>
            <p className="mt-2 text-xs text-foreground/60">{selections.length} of {details.services.length} services selected</p>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div className="min-w-0">
                <dt className="text-xs text-foreground/60">Planned budget</dt>
                <dd className="mt-1 break-words text-sm font-semibold">{plannedSen === null ? "Not set yet" : money(plannedSen)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-foreground/60">{remainingSen !== null && remainingSen < 0 ? "Over budget" : "Remaining budget"}</dt>
                <dd className={`mt-1 break-words text-sm font-semibold ${remainingSen !== null && remainingSen < 0 ? "text-red-600" : "text-(--positive-tertiary)"}`}>
                  {remainingSen === null ? "Not available yet" : money(Math.abs(remainingSen))}
                </dd>
              </div>
              <div className="col-span-2 rounded-xl border border-(--positive-secondary) bg-(--positive)/20 p-4 text-(--positive-tertiary)">
                <dt className="text-xs">Selected package total</dt>
                <dd className="libre-font mt-2 break-words text-2xl">{selectedSen === null ? "Guest count needed" : money(selectedSen)}</dd>
              </div>
            </dl>
            {plannedSen !== null && selectedSen !== null && (
              <progress aria-label="Selected packages as a share of planned budget" max={plannedSen} value={Math.min(selectedSen, plannedSen)} className="mt-4 h-2 w-full accent-(--positive-tertiary)" />
            )}
            <p className="sr-only" role="status">
              {selections.length} packages selected. Estimated total {selectedSen === null ? "needs a guest count" : money(selectedSen)}.
              {remainingSen !== null && ` ${remainingSen < 0 ? "Over budget" : "Remaining"}: ${money(Math.abs(remainingSen))}.`}
            </p>
            {(plannedSen === null || selectedSen === null) && (
              <div className="mt-4 text-xs leading-5 text-foreground/65">
                <p>Complete your service budgets and guest count to see the full budget comparison.</p>
                <MainButton href="/weddingplan" variant="link" size="small">Edit wedding details</MainButton>
              </div>
            )}
            {details.services.length === 0 ? (
              <p className="py-6 text-sm leading-6 text-foreground/65">Choose your wedding services to start building your budget.</p>
            ) : (
              <ul className="mt-5 divide-y divide-(--secondary)">
                {details.services.map((serviceId) => {
                  const pkg = selections.find((item) => item.serviceId === serviceId);
                  const Icon = serviceIcons[serviceId as keyof typeof serviceIcons] ?? GiFamilyHouse;
                  const name = services.find((service) => service.id === serviceId)?.serviceName
                    ?? pkg?.serviceName ?? serviceNames[serviceId] ?? `Service ${serviceId}`;
                  return (
                  <li key={serviceId} className="py-3 first:pt-0">
                    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-stretch gap-2">
                      <span aria-hidden="true" className="relative rounded-lg bg-(--secondary) text-(--positive-tertiary)">
                        <Icon className="absolute inset-0 h-full w-full p-1.5" />
                      </span>
                      <div className="flex min-h-9 min-w-0 flex-col justify-center gap-0.5">
                        <p className="break-words text-xs font-semibold text-(--positive-tertiary)">{name}</p>
                        <p className={`break-words text-xs ${pkg ? "font-medium" : "text-foreground/50"}`}>
                          {pkg?.vendorName ?? "No Package Chosen"}
                        </p>
                      </div>
                      {pkg && (
                        <MainButton variant="ghost" size="icon" className="self-center" onClick={() => removePackage(serviceId)}
                          aria-label={`Remove ${pkg.packageName} from budget`} title="Remove package">
                          <BsTrash aria-hidden="true" />
                        </MainButton>
                      )}
                    </div>
                    {pkg && (
                    <div className="mt-2">
                    <p className="mt-1 break-words text-xs text-foreground/60">{pkg.packageName}</p>
                    {pkg.serviceId === SERVICE_ID.CATERING && (
                      <p className="mt-2 text-xs text-foreground/60">{currency.format(pkg.unitPrice)} × {details.pax > 0 ? `${details.pax} guests` : "guest count needed"}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{pkg.costSen === null ? "Total pending" : money(pkg.costSen)}</p>
                    </div>
                    </div>
                    )}
                  </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-4 border-t border-(--secondary) pt-4 text-xs leading-5 text-foreground/50">Saved on this device. Totals cover selected packages only and are estimates, not bookings or confirmed vendor prices.</p>
          </>
        )}
      </div>
    </aside>
  );
}
