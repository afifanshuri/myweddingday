"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FiGrid, FiSearch } from "react-icons/fi";
import { useAccountAccess } from "./AccountAccessProvider";
import MainButton from "./MainButton";
import LogoutButton from "./LogoutButton";
import { ROUTES, vendorSearchRoute } from "@/config/routes";
import { VENDOR_LOOKUP } from "@/config/plans";
import SearchAllowance from "./SearchAllowance";

function VendorNameSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim().replace(/\s+/g, " ");
    if (value.length >= VENDOR_LOOKUP.minLength) router.push(vendorSearchRoute(value));
  }
  return <form role="search" onSubmit={submit}
    className="order-last flex w-full items-center gap-2 rounded-lg border border-(--tertiary) bg-white px-3 py-2 sm:order-none sm:ml-4 sm:w-auto sm:max-w-sm sm:flex-1">
    <label htmlFor="vendor-name-search" className="sr-only">Search vendors by name</label>
    <FiSearch aria-hidden="true" className="shrink-0 text-foreground/50" />
    <input id="vendor-name-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
      minLength={VENDOR_LOOKUP.minLength} maxLength={VENDOR_LOOKUP.maxLength} placeholder="Search vendors by name"
      className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-foreground/50" />
  </form>;
}

export default function AccountNavigation({ children }: { children?: ReactNode }) {
  const { access, checking } = useAccountAccess();
  if (checking || !access.userId) return null;

  return <nav aria-label="Account navigation" className="flex flex-wrap items-center justify-between gap-3 border-b border-(--tertiary) bg-(--background) px-5 py-3 text-(--positive-tertiary)">
    <div><span className="libre-font text-lg">myweddingday.</span><SearchAllowance key={access.userId} /></div>
    {access.canViewVendorIdentity && <VendorNameSearch />}
    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
      {children}
      {access.role !== "admin" && <MainButton href={ROUTES.dashboard} variant="ghost" size="small">
        <FiGrid aria-hidden="true" />
        Dashboard
      </MainButton>}
      <LogoutButton />
    </div>
  </nav>;
}
