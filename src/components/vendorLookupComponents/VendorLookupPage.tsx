"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import MainButton from "@/components/commonComponents/MainButton";
import VendorContainer from "@/components/matchComponents/VendorContainer";
import VendorPackagesView from "@/components/matchComponents/VendorPackagesView";
import MatchLoading from "@/components/matchComponents/MatchLoading";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import { useServiceStore } from "@/store/serviceStore";
import { APISearchVendorsByName, SearchRequestError } from "@/services/api/vendors";
import { VENDOR_LOOKUP } from "@/config/plans";
import { ROUTES, vendorSearchRoute } from "@/config/routes";
import type { VendorLookupResult } from "@/types/search";

type LoadState =
  | { status: "idle" }
  | { status: "done"; key: string; data: VendorLookupResult }
  | { status: "error"; key: string; message: string };

export default function VendorLookupPage() {
  const router = useRouter();
  const query = (useSearchParams().get("q") ?? "").trim();
  const { access, checking, revision } = useAccountAccess();
  const services = useServiceStore((state) => state.service);
  const initServices = useServiceStore((state) => state.initServices);
  const [draft, setDraft] = useState(query);
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // A search started from the navigation bar changes ?q= while this page stays mounted.
  const [shownQuery, setShownQuery] = useState(query);
  if (shownQuery !== query) {
    setShownQuery(query);
    setDraft(query);
    setSelectedId(null);
  }
  // Results are tied to the access revision, so they disappear if the pass expires or the user changes.
  const key = `${revision}:${query}`;
  const valid = query.length >= VENDOR_LOOKUP.minLength && query.length <= VENDOR_LOOKUP.maxLength;

  useEffect(() => { void initServices().catch(() => {}); }, [initServices]);

  useEffect(() => {
    if (checking || !access.canViewVendorIdentity || !valid) return;
    const controller = new AbortController();
    APISearchVendorsByName(query, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setState({ status: "done", key, data }); })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        const message = cause instanceof SearchRequestError && cause.status === 429
          ? "You're searching quickly. Please wait a minute and try again."
          : cause instanceof Error ? cause.message : "Unable to search vendors.";
        setState({ status: "error", key, message });
      });
    return () => controller.abort();
  }, [checking, access.canViewVendorIdentity, valid, query, key]);

  const current = state.status !== "idle" && state.key === key ? state : null;
  const results = current?.status === "done" ? current.data.results : [];
  const selected = results.find((match) => match.vendor.id === selectedId) ?? null;
  const serviceName = (id: number) => services.find((service) => service.id === id)?.serviceName ?? `Service ${id}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSelectedId(null);
    router.replace(vendorSearchRoute(draft.trim().replace(/\s+/g, " ")));
  }

  if (checking || !access.canViewVendorIdentity) return <MatchLoading />;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8">
      {selected ? (
        <VendorPackagesView match={selected} context="lookup" onBack={() => setSelectedId(null)} />
      ) : <>
        <header>
          <h1 className="libre-font text-3xl text-(--positive-tertiary)">Find a vendor</h1>
          <p className="mt-2 text-sm text-foreground/65">Search vendors by name to see their details and all of their packages.</p>
        </header>
        <form role="search" onSubmit={submit} className="flex max-w-xl gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-(--tertiary) bg-white px-3 py-2">
            <span className="sr-only">Vendor name</span>
            <FiSearch aria-hidden="true" className="shrink-0 text-foreground/50" />
            <input type="search" value={draft} onChange={(event) => setDraft(event.target.value)}
              minLength={VENDOR_LOOKUP.minLength} maxLength={VENDOR_LOOKUP.maxLength} required
              placeholder="e.g. Rosewood" className="min-w-0 w-full bg-transparent text-sm outline-none" />
          </label>
          <MainButton type="submit" size="small">Search</MainButton>
        </form>

        <div aria-live="polite" className="flex flex-col gap-4">
          {!query ? <p className="text-sm text-foreground/60">Enter at least {VENDOR_LOOKUP.minLength} characters of a vendor&apos;s name.</p>
            : !valid ? <p role="alert" className="text-sm">Use between {VENDOR_LOOKUP.minLength} and {VENDOR_LOOKUP.maxLength} characters.</p>
            : !current ? <MatchLoading />
            : current.status === "error" ? <p role="alert" className="text-sm">{current.message}</p>
            : results.length === 0 ? <div className="text-sm">
                <p>No vendors found for &ldquo;{current.data.query}&rdquo;.</p>
                <MainButton href={ROUTES.weddingPlan} variant="link" size="small">Find vendors by your preferences instead</MainButton>
              </div>
            : <>
                <p className="text-sm text-foreground/60">
                  {current.data.limited
                    ? `Showing the first ${results.length} vendors. Add more of the name to narrow the results.`
                    : `${results.length} ${results.length === 1 ? "vendor" : "vendors"} found.`}
                </p>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {results.map((match) => <li key={match.vendor.id} className="min-w-0">
                    <VendorContainer match={match} serviceName={serviceName(match.vendor.serviceId)}
                      priceLabel={`${serviceName(match.vendor.serviceId)} · packages from`} onSelect={setSelectedId} />
                  </li>)}
                </ul>
              </>}
        </div>
      </>}
    </main>
  );
}
