"use client";

import { BsBookmark } from "react-icons/bs";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useServiceStore } from "@/store/serviceStore";
import { dismissShortlistNotice, loadShortlistDetails, useShortlistDetails } from "@/store/shortlistDetails";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import MainButton from "@/components/commonComponents/MainButton";
import type { VendorDetailedMatch } from "@/types/dtoTypes";
import VendorContainer from "./VendorContainer";
import VendorPackagesView from "./VendorPackagesView";
import { useHistoryParam } from "@/hooks/useHistoryParam";

/**
 * The vendors the user is keeping in view, grouped by service, with current details (a shortlist outlives any search).
 * Details come from the shared shortlist store (loaded in the background by the shortlist panel). Kept apart from the
 * budget: opening a vendor here and choosing a package is what adds it to the budget.
 */
export default function ShortlistSection({ owner }: { owner: string }) {
  const { access } = useAccountAccess();
  const shortlist = usePreferenceStore((state) => state.shortlist);
  const planServices = usePreferenceStore((state) => state.weddingDetails.services);
  const planNames = usePreferenceStore((state) => state.weddingDetails.serviceNames);
  const catalogue = useServiceStore((state) => state.service);
  const { owner: loadedFor, vendors, loading, failed, removed } = useShortlistDetails();
  const known = loadedFor === owner ? vendors : null;
  // The open vendor is kept in the address (?shortlisted=), so the browser Back button returns to the shortlist.
  const [openId, openVendor, closeVendor] = useHistoryParam("shortlisted");

  const open = openId !== null ? known?.get(openId)?.match : undefined;
  if (open && !open.identityLocked) {
    return <VendorPackagesView match={open as VendorDetailedMatch} onBack={closeVendor} backLabel="Back to shortlist" fromShortlist />;
  }

  const nameOf = (id: number) => catalogue.find((service) => service.id === id)?.serviceName ?? planNames[id] ?? `Service ${id}`;
  // Services in the plan first, in plan order, then any others still on the shortlist.
  const groups = [...new Set([...planServices, ...shortlist.map((entry) => entry.serviceId)])]
    .map((serviceId) => ({ serviceId, entries: shortlist.filter((entry) => entry.serviceId === serviceId) }))
    .filter((group) => group.entries.length);
  const waiting = !known?.size && shortlist.length > 0 && !failed;

  return <div className="min-w-0">
    <p className="max-w-[65ch] text-sm leading-6 text-foreground/70">
      Vendors you&apos;re keeping in view. They aren&apos;t in your budget until you open one and choose a package.
      {!access.canViewVendorIdentity && " Your free search unlocked one vendor per service; Plus opens them all."}
    </p>
    {removed > 0 && <p role="status" className="mt-4 rounded-lg border border-(--tertiary) p-3 text-xs">
      {removed === 1 ? "A shortlisted vendor is" : `${removed} shortlisted vendors are`} no longer available, so {removed === 1 ? "it was" : "they were"} removed.
      <button type="button" className="ml-2 underline" onClick={dismissShortlistNotice}>Dismiss</button>
    </p>}
    {failed && <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
      <p>Your shortlist couldn&apos;t be loaded.</p>
      <MainButton size="small" variant="secondary" disabled={loading}
        onClick={() => void loadShortlistDetails(owner, shortlist.map((entry) => entry.vendorId), true)}>Try again</MainButton>
    </div>}
    {shortlist.length === 0 ? <div className="mt-5 flex items-start gap-3 rounded-xl border border-dashed border-(--tertiary) p-5 text-sm leading-6">
      <BsBookmark aria-hidden="true" className="mt-1 shrink-0 text-(--positive-tertiary)" />
      <p>Nothing shortlisted yet. Tap the bookmark on any vendor in your matches to keep it here while you decide.</p>
    </div> : waiting ? <p role="status" className="mt-5 flex items-center gap-3 text-sm text-(--positive-tertiary)">
      <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-(--tertiary) border-t-(--positive-tertiary) motion-reduce:animate-[spin_3s_linear_infinite]" />
      Loading your shortlist…
    </p>
      : <div className="mt-6 space-y-8">
        {groups.map(({ serviceId, entries }) => {
          const matches = entries.flatMap((entry) => known?.get(entry.vendorId)?.match ?? []);
          return <section key={serviceId} aria-labelledby={`shortlist-service-${serviceId}`}>
            <h3 id={`shortlist-service-${serviceId}`} className="text-sm font-semibold text-(--positive-tertiary)">
              {nameOf(serviceId)} <span className="font-normal text-foreground/60">({entries.length})</span>
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {matches.map((match) => <VendorContainer key={match.vendor.id} match={match} serviceName={nameOf(serviceId)}
                priceLabel="Packages from" onSelect={openVendor} />)}
            </div>
          </section>;
        })}
      </div>}
  </div>;
}
