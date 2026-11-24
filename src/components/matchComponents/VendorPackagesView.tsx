"use client";

import MainButton from "@/components/commonComponents/MainButton";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useServiceStore } from "@/store/serviceStore";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import { VendorAndPackagesMatchDTOType } from "@/types/dtoTypes";
import { SERVICE_ID } from "@/config/serviceCriteria";
import PackageAttachments from "./PackageAttachments";
import ShortlistButton from "./ShortlistButton";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaStar,
  FaPhoneAlt,
  FaInstagram,
  FaTiktok,
  FaFacebookF,
  FaCheck,
} from "react-icons/fa";

const currency = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
});

export default function VendorPackagesView({
  match,
  onBack,
  backLabel = "Back to matches",
  fromShortlist = false,
}: {
  match: VendorAndPackagesMatchDTOType;
  onBack: () => void;
  backLabel?: string;
  /** Opened from the shortlist: shows all the vendor's packages rather than the ones matched by a search. */
  fromShortlist?: boolean;
}) {
  const vendor = match.vendor;
  const { access, checking } = useAccountAccess();
  // selectPackage ignores services outside the plan; say so instead of failing silently.
  const inPlan = usePreferenceStore((state) => state.weddingDetails.services.includes(vendor.serviceId));
  const selectedPackage = usePreferenceStore((state) => state.selectedPackages.find((pkg) => pkg.serviceId === vendor.serviceId));
  const selectPackage = usePreferenceStore((state) => state.selectPackage);
  const removeSelectedPackage = usePreferenceStore((state) => state.removeSelectedPackage);
  const serviceName = useServiceStore((state) => state.service.find((service) => service.id === vendor.serviceId)?.serviceName) ?? `Service ${vendor.serviceId}`;
  const packages = [...match.packages].sort((a, b) => a.price - b.price);
  const isCatering = vendor.serviceId === SERVICE_ID.CATERING;
  const reduceMotion = useReducedMotion();
  const socialLinks = [
    { label: "Instagram", url: vendor.instagram?.trim(), icon: FaInstagram },
    { label: "TikTok", url: vendor.tiktok?.trim(), icon: FaTiktok },
    { label: "Facebook", url: vendor.facebook?.trim(), icon: FaFacebookF },
  ].filter((social) => social.url && /^https?:\/\//i.test(social.url));

  // The server only sends full details (this view) for vendors this account may see: any for Plus, unlocked ones for free.
  if (checking || !access.userId) return null;
  return (
    <section className="flex flex-col gap-6" aria-labelledby="vendor-packages-title">
      <MainButton variant="ghost" size="small"
        type="button"
        onClick={onBack}
        className="w-fit"
      >
        <FaArrowLeft aria-hidden="true" />
        {backLabel}
      </MainButton>

      <header className="overflow-hidden rounded-xl border border-(--tertiary) bg-white">
        <div className="h-2 bg-(--positive)" />
        <div className="flex flex-col gap-5 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-(--secondary) text-xl text-(--positive-tertiary)">
              {vendor.vendorName.trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 id="vendor-packages-title" className="libre-font break-words text-xl sm:text-2xl">{vendor.vendorName}</h1>
                <ShortlistButton vendorId={vendor.id} serviceId={vendor.serviceId} vendorLabel={vendor.vendorName} variant="labelled" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-normal">
                <span className="flex items-center gap-2">
                  <FaStar aria-hidden="true" className="text-amber-500" />
                  {vendor.rating == null ? "Not rated yet" : `${Number(vendor.rating).toFixed(1)} / 5`}
                </span>
                <span>{packages.length} {fromShortlist ? "" : "matched "}{packages.length === 1 ? "package" : "packages"}</span>
              </div>
            </div>
          </div>
          {vendor.detail && (
            <p className="whitespace-pre-wrap break-words text-sm font-normal leading-relaxed">{vendor.detail}</p>
          )}
          {socialLinks.length > 0 && (
            <nav aria-label={`${vendor.vendorName} social media`} className="flex flex-wrap gap-2">
              {socialLinks.map(({ label, url, icon: Icon }) => (
                <MainButton variant="secondary" size="small"
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${vendor.vendorName} on ${label} (opens in a new tab)`}
                  className="font-normal"
                >
                  <Icon aria-hidden="true" />
                  {label}
                </MainButton>
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
            <h2 className="libre-font text-lg">{fromShortlist ? "Packages" : "Matched packages"}</h2>
            <p className="mt-2 text-sm font-normal">{fromShortlist ? "Every package this vendor offers." : "Compare the packages returned for your preferences."} Shortlisting keeps a vendor in view; only the package you choose counts towards your budget.</p>
            {!inPlan && <p className="mt-2 text-xs font-normal text-foreground/60">{serviceName} isn&apos;t in your wedding plan yet. Add it in your plan to include these packages in your budget.</p>}
          </div>
          {packages.length > 1 && <p className="text-xs font-normal text-(--positive-tertiary)">Price: low to high</p>}
        </div>

        {packages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-(--tertiary) bg-white px-5 py-10 text-center">
            <FaBoxOpen aria-hidden="true" className="text-2xl text-(--positive-secondary)" />
            <p className="text-sm font-normal">{fromShortlist ? "This vendor has no packages available right now." : "No matched packages available for this vendor."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
            {packages.map((pkg, index) => {
              const chosen = selectedPackage?.packageId === pkg.id;
              return (
              // Choosing a package gives its card a short "pop" and a ring; the tick and the label animate in.
              <motion.article key={pkg.id}
                animate={reduceMotion ? undefined : chosen
                  ? { scale: [1, 1.025, 1], boxShadow: "0 0 0 3px var(--positive)" }
                  : { scale: 1, boxShadow: "0 0 0 0px var(--positive)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`flex min-w-0 flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-colors duration-300 motion-reduce:transition-none ${chosen ? "border-(--positive-tertiary)" : "border-(--tertiary)"}`}>
                <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                  <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-normal text-(--positive-tertiary)">Package {index + 1}</span>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {chosen ? (
                        <motion.span key="chosen" aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-(--positive-tertiary) text-white"
                          initial={reduceMotion ? false : { scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}
                          exit={reduceMotion ? undefined : { scale: 0, opacity: 0, transition: { duration: 0.15 } }}
                          transition={{ type: "spring", stiffness: 500, damping: 22 }}>
                          <FaCheck className="text-xs" />
                        </motion.span>
                      ) : index === 0 && packages.length > 1 && (
                        <motion.span key="lowest" className="rounded-full bg-(--secondary) px-3 py-1 text-xs font-medium text-(--positive-tertiary)"
                          initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                          exit={reduceMotion ? undefined : { opacity: 0, transition: { duration: 0.1 } }}>Lowest price</motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <h3 className="break-words text-lg font-semibold">{pkg.packageName}</h3>
                  <p className="whitespace-pre-wrap break-words text-sm font-normal leading-relaxed">
                    {pkg.details || "No description provided for this package."}
                  </p>
                  <PackageAttachments attachments={pkg.attachments} packageName={pkg.packageName} />
                </div>
                <div className="border-t border-(--secondary) bg-(--background) px-5 py-4 sm:px-6">
                  {inPlan && <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm">
                    <input type="radio" name={`package-${vendor.serviceId}`} className="accent-(--positive-tertiary)"
                      checked={selectedPackage?.packageId === pkg.id}
                      aria-label={`${selectedPackage?.packageId === pkg.id ? "Remove" : "Choose"} ${pkg.packageName} from ${vendor.vendorName} ${selectedPackage?.packageId === pkg.id ? "from" : "for"} my budget`}
                      onClick={() => {
                        if (selectedPackage?.packageId === pkg.id) removeSelectedPackage(vendor.serviceId);
                      }}
                      onChange={() => selectPackage({ serviceId: vendor.serviceId, serviceName,
                        vendorId: vendor.id, vendorName: vendor.vendorName, packageId: pkg.id,
                        packageName: pkg.packageName, unitPrice: Number(pkg.price) })} />
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span key={chosen ? "in" : "choose"} className={chosen ? "font-semibold text-(--positive-tertiary)" : undefined}
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                        {chosen ? "In my budget" : "Choose for my budget"}
                      </motion.span>
                    </AnimatePresence>
                  </label>}
                  <p className="text-xs font-normal">{isCatering ? "Price per guest" : "Package price"}</p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-2 text-2xl font-semibold text-(--positive-tertiary)">
                    {currency.format(pkg.price)}
                    {isCatering && <span className="text-sm font-normal">/ pax</span>}
                  </p>
                </div>
              </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
