import "@/css/locked-vendor.css";

export default function LockedVendorDetail({ contact = false }: { contact?: boolean }) {
  return <span className="locked-vendor-detail">
    <span aria-hidden="true" className="locked-vendor-placeholder">{contact ? "012 345 6789" : "Vendor name"}</span>
    <span className="sr-only">{contact ? "Vendor contacts locked" : "Vendor name locked"}</span>
  </span>;
}
