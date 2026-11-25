"use client";
import { useT } from "@/i18n";

import "@/css/locked-vendor.css";

export default function LockedVendorDetail({ contact = false }: { contact?: boolean }) {
  const t = useT();
  return <span className="locked-vendor-detail">
    <span aria-hidden="true" className="locked-vendor-placeholder">{contact ? "012 345 6789" : t.vendor.lockedNamePlaceholder}</span>
    <span className="sr-only">{contact ? t.vendor.lockedContacts : t.vendor.lockedName}</span>
  </span>;
}
