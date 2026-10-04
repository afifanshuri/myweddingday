import { VendorAndPackagesMatchDTOType } from "@/types/dtoTypes";
import { SERVICE_ID } from "@/config/serviceCriteria";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaStar,
  FaPhoneAlt,
  FaInstagram,
  FaTiktok,
  FaFacebookF,
} from "react-icons/fa";

const currency = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
});

export default function VendorPackagesView({
  match,
  onBack,
}: {
  match: VendorAndPackagesMatchDTOType;
  onBack: () => void;
}) {
  const vendor = match.vendor;
  const packages = [...match.packages].sort((a, b) => a.price - b.price);
  const isCatering = vendor.serviceId === SERVICE_ID.CATERING;
  const socialLinks = [
    { label: "Instagram", url: vendor.instagram?.trim(), icon: FaInstagram },
    { label: "TikTok", url: vendor.tiktok?.trim(), icon: FaTiktok },
    { label: "Facebook", url: vendor.facebook?.trim(), icon: FaFacebookF },
  ].filter((social) => social.url && /^https?:\/\//i.test(social.url));

  return (
    <section className="flex flex-col gap-6" aria-labelledby="vendor-packages-title">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-2 rounded-lg py-2 pr-3 text-sm cursor-pointer text-(--positive-tertiary) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <FaArrowLeft aria-hidden="true" />
        Back to matches
      </button>

      <header className="overflow-hidden rounded-xl border border-(--tertiary) bg-white">
        <div className="h-2 bg-(--positive)" />
        <div className="flex flex-col gap-5 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-(--secondary) text-xl text-(--positive-tertiary)">
              {vendor.vendorName.trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-normal uppercase tracking-wider text-(--positive-tertiary)">Your vendor match</p>
              <h1 id="vendor-packages-title" className="libre-font mt-2 break-words text-xl sm:text-2xl">{vendor.vendorName}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-normal">
                <span className="flex items-center gap-2">
                  <FaStar aria-hidden="true" className="text-amber-500" />
                  {vendor.rating == null ? "Not rated yet" : `${Number(vendor.rating).toFixed(1)} / 5`}
                </span>
                <span>{packages.length} matched {packages.length === 1 ? "package" : "packages"}</span>
              </div>
            </div>
          </div>
          {vendor.detail && (
            <p className="whitespace-pre-wrap break-words text-sm font-normal leading-relaxed">{vendor.detail}</p>
          )}
          {socialLinks.length > 0 && (
            <nav aria-label={`${vendor.vendorName} social media`} className="flex flex-wrap gap-2">
              {socialLinks.map(({ label, url, icon: Icon }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${vendor.vendorName} on ${label} (opens in a new tab)`}
                  className="flex items-center gap-2 rounded-lg border border-(--tertiary) px-3 py-2 text-sm font-normal text-(--positive-tertiary) transition hover:bg-(--secondary) focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <Icon aria-hidden="true" />
                  {label}
                </a>
              ))}
            </nav>
          )}
          {vendor.contact && (
            <p className="flex items-center gap-2 border-t border-(--secondary) pt-4 text-sm font-normal">
              <FaPhoneAlt aria-hidden="true" className="text-(--positive-tertiary)" />
              {vendor.contact}
            </p>
          )}
        </div>
      </header>

      <div>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="libre-font text-lg">Matched Packages</h2>
            <p className="mt-2 text-sm font-normal">Compare the packages returned for your preferences.</p>
          </div>
          {packages.length > 1 && <p className="text-xs font-normal text-(--positive-tertiary)">Price: low to high</p>}
        </div>

        {packages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-(--tertiary) bg-white px-5 py-10 text-center">
            <FaBoxOpen aria-hidden="true" className="text-2xl text-(--positive-secondary)" />
            <p className="text-sm font-normal">No matched packages available for this vendor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
            {packages.map((pkg, index) => (
              <article key={pkg.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-(--tertiary) bg-white shadow-sm">
                <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-normal text-(--positive-tertiary)">Package {index + 1}</span>
                    {index === 0 && packages.length > 1 && (
                      <span className="rounded-full bg-(--secondary) px-3 py-1 text-xs font-medium text-(--positive-tertiary)">Lowest price</span>
                    )}
                  </div>
                  <h3 className="break-words text-lg font-semibold">{pkg.packageName}</h3>
                  <p className="whitespace-pre-wrap break-words text-sm font-normal leading-relaxed">
                    {pkg.details || "No description provided for this package."}
                  </p>
                </div>
                <div className="border-t border-(--secondary) bg-(--background) px-5 py-4 sm:px-6">
                  <p className="text-xs font-normal">{isCatering ? "Price per guest" : "Package price"}</p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-2 text-2xl font-semibold text-(--positive-tertiary)">
                    {currency.format(pkg.price)}
                    {isCatering && <span className="text-sm font-normal">/ pax</span>}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
