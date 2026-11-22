"use client";

import { useEffect, useState } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import { useServiceStore } from "@/store/serviceStore";
import { APIListAdminVendors, type AdminVendorList as VendorList } from "@/services/api/adminVendors";
import { ROUTES, adminVendorRoute } from "@/config/routes";
import { VENDOR_STATUSES, type VendorStatus } from "@/config/vendorStatus";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";
import VendorStatusBadge from "./VendorStatusBadge";

const TABS: { value: VendorStatus | null; label: string }[] = [
  { value: null, label: "All" },
  ...VENDOR_STATUSES.map((value) => ({ value, label: value === "pending" ? "Review queue" : value[0].toUpperCase() + value.slice(1) })),
];

export default function AdminVendorList() {
  const { access, checking } = useAccountAccess();
  const initServices = useServiceStore((state) => state.initServices);
  const services = useServiceStore((state) => state.service);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState({ q: "", serviceId: null as number | null, status: null as VendorStatus | null, page: 1 });
  const [result, setResult] = useState<{ key: string; data: VendorList } | null>(null);
  const [error, setError] = useState("");
  const key = JSON.stringify(query);

  useEffect(() => { initServices().catch(() => {}); }, [initServices]);
  useEffect(() => {
    if (checking || access.role !== "admin") return;
    const controller = new AbortController();
    APIListAdminVendors(query, controller.signal)
      .then((data) => { if (!controller.signal.aborted) { setResult({ key, data }); setError(""); } })
      .catch((cause: Error) => { if (!controller.signal.aborted) { setResult(null); setError(cause.message); } });
    return () => controller.abort();
  }, [query, key, checking, access.role]);
  const data = result?.key === key ? result.data : null;
  // Keep showing the last known count while another tab loads.
  const pendingCount = result?.data.pendingCount ?? null;

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="libre-font text-3xl text-(--positive-tertiary)">Vendors</h1>
        <p className="mt-2 text-sm text-foreground/65">Find a vendor to edit its details, packages and photos, or delete it.</p>
      </div>
      <MainButton href={ROUTES.adminNewVendor}>Add a vendor</MainButton>
    </div>
    <nav aria-label="Listing status" className="mt-6 flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active = query.status === tab.value;
        return <button key={tab.label} type="button" aria-pressed={active}
          className={`rounded-full border px-4 py-1.5 text-sm ${active ? "border-(--positive-tertiary) bg-(--positive-tertiary) text-white" : "border-(--tertiary) bg-white"}`}
          onClick={() => setQuery((current) => ({ ...current, status: tab.value, page: 1 }))}>
          {tab.label}{tab.value === "pending" && pendingCount !== null && ` (${pendingCount})`}
        </button>;
      })}
    </nav>
    {query.status === "pending" && <p className="mt-3 text-sm text-foreground/65">New listings wait here until you approve them. Customers don&apos;t see them until then. Open one to check it, edit it if needed, then approve or reject it.</p>}
    <form role="search" className="mt-6 flex flex-wrap items-end gap-3" onSubmit={(event) => {
      event.preventDefault();
      setQuery((current) => ({ ...current, q: draft.trim(), page: 1 }));
    }}>
      <label className="flex min-w-60 flex-1 flex-col gap-1 text-xs">Vendor name
        <input type="search" value={draft} maxLength={100} onChange={(event) => setDraft(event.target.value)}
          className="rounded-lg border border-(--tertiary) bg-white p-2 text-sm" placeholder="Search by name" />
      </label>
      <label className="flex flex-col gap-1 text-xs">Service
        <select value={query.serviceId ?? ""} className="rounded-lg border border-(--tertiary) bg-white p-2 text-sm"
          onChange={(event) => setQuery((current) => ({ ...current, serviceId: event.target.value ? Number(event.target.value) : null, page: 1 }))}>
          <option value="">All services</option>
          {services.map((service) => <option key={service.id} value={service.id}>{service.serviceName}</option>)}
        </select>
      </label>
      <MainButton type="submit" size="small" variant="secondary">Search</MainButton>
    </form>
    {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
    {!data ? (error ? <p role="alert" className="py-8">Vendors could not be loaded.</p> : <LoadingScreen label="Loading vendors…" backdrop={false} />) : <>
      <p className="mt-5 text-xs text-foreground/60" aria-live="polite">{data.total} vendor{data.total === 1 ? "" : "s"}{query.q && ` matching “${query.q}”`}</p>
      <ul className="mt-2 divide-y divide-(--tertiary) overflow-hidden rounded-xl border border-(--tertiary) bg-white">
        {data.vendors.map((vendor) => <li key={vendor.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 break-words font-medium">{vendor.vendorName} <VendorStatusBadge status={vendor.status} /></p>
            <p className="mt-1 text-xs text-foreground/60">{vendor.serviceName} · {vendor.packageCount} package{vendor.packageCount === 1 ? "" : "s"} · {vendor.locationCount} location{vendor.locationCount === 1 ? "" : "s"} · Added {new Date(vendor.createdAt).toLocaleDateString("en-MY")}</p>
          </div>
          <MainButton href={adminVendorRoute(vendor.id)} size="small" variant="secondary" aria-label={`${vendor.status === "pending" ? "Review" : "Edit"} ${vendor.vendorName}`}>{vendor.status === "pending" ? "Review" : "Edit"}</MainButton>
        </li>)}
        {!data.vendors.length && <li className="p-5 text-sm">{query.status === "pending" && !query.q && query.serviceId === null ? "No listings are waiting for review." : "No vendors found."}</li>}
      </ul>
      {data.pageCount > 1 && <nav aria-label="Vendor pages" className="mt-5 flex items-center justify-between gap-3">
        <MainButton variant="secondary" size="small" disabled={query.page <= 1} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}>Previous</MainButton>
        <span className="text-sm">Page {data.page} of {data.pageCount}</span>
        <MainButton variant="secondary" size="small" disabled={query.page >= data.pageCount} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}>Next</MainButton>
      </nav>}
    </>}
  </main>;
}
