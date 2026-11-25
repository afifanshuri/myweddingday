"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FiArrowLeft, FiCheck, FiPhone, FiStar } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";
import { BsBoxSeam } from "react-icons/bs";
import { serviceName as displayServiceName, useT } from "@/i18n";
import MainButton from "@/components/commonComponents/MainButton";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useServiceStore } from "@/store/serviceStore";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import { useLocationNames } from "@/hooks/useLocationNames";
import type { VendorAndPackagesMatchDTOType } from "@/types/dtoTypes";
import { SERVICE_ID } from "@/config/serviceCriteria";
import PackageAttachments from "./PackageAttachments";
import ShortlistButton from "./ShortlistButton";
import PhotoViewer from "./PhotoViewer";

const currency = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", minimumFractionDigits: 0, maximumFractionDigits: 2 });
// Package details longer than this start folded to a few lines.
const LONG_DETAILS = 220;
const pill = "inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary)";

/**
 * A vendor's page, read like their price sheet: photos, who they are and how to reach them, then their packages as
 * one ruled list, cheapest first, so prices compare down a single column. The package chosen for the budget is the
 * one solid plum row. Opened from the results (matched packages) or the shortlist (every package).
 */
export default function VendorPackagesView({ match, onBack, backLabel, fromShortlist = false }: {
  match: VendorAndPackagesMatchDTOType;
  onBack: () => void;
  backLabel?: string;
  /** Opened from the shortlist: shows all the vendor's packages rather than the ones matched by a search. */
  fromShortlist?: boolean;
}) {
  const vendor = match.vendor;
  const { access, checking } = useAccountAccess();
  const t = useT();
  const reduceMotion = useReducedMotion();
  // selectPackage ignores services outside the plan; say so instead of failing silently.
  const inPlan = usePreferenceStore((state) => state.weddingDetails.services.includes(vendor.serviceId));
  const selectedPackage = usePreferenceStore((state) => state.selectedPackages.find((pkg) => pkg.serviceId === vendor.serviceId));
  const selectPackage = usePreferenceStore((state) => state.selectPackage);
  const removeSelectedPackage = usePreferenceStore((state) => state.removeSelectedPackage);
  // The database name is what's saved with a chosen package; the translated one is only shown.
  // Opened straight from a link, the services list may not be loaded yet: use the name saved in the plan, and load the list.
  const catalogueName = useServiceStore((state) => state.service.find((service) => service.id === vendor.serviceId)?.serviceName);
  const planName = usePreferenceStore((state) => state.weddingDetails.serviceNames[vendor.serviceId]);
  const servicesLoaded = useServiceStore((state) => state.isLoaded);
  const initServices = useServiceStore((state) => state.initServices);
  useEffect(() => { if (!catalogueName && !servicesLoaded) void initServices().catch(() => {}); }, [catalogueName, servicesLoaded, initServices]);
  const serviceName = catalogueName ?? planName ?? `Service ${vendor.serviceId}`;
  const shownService = displayServiceName(t, vendor.serviceId, serviceName);
  const places = useLocationNames(vendor.locationId ?? []);
  const packages = [...match.packages].sort((a, b) => a.price - b.price);
  const isCatering = vendor.serviceId === SERVICE_ID.CATERING;
  const [failed, setFailed] = useState<string[]>([]);
  const photos = vendor.imageUrls.filter((url) => !failed.includes(url));
  const [viewing, setViewing] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number[]>([]);
  const phone = vendor.contact?.trim();
  const socials = [
    { label: "Instagram", url: vendor.instagram?.trim(), icon: FaInstagram },
    { label: "TikTok", url: vendor.tiktok?.trim(), icon: FaTiktok },
    { label: "Facebook", url: vendor.facebook?.trim(), icon: FaFacebookF },
  ].filter((social) => social.url && /^https?:\/\//i.test(social.url));

  // The server only sends full details (this view) for vendors this account may see: any for Plus, unlocked ones for free.
  if (checking || !access.userId) return null;
  const rating = vendor.rating == null ? null : Number(vendor.rating).toFixed(1);
  // Tiles by how many photos there are: 1 wide, 2 side by side, a large one with 2 or 4 beside it.
  const tileCount = photos.length >= 5 ? 5 : photos.length >= 3 ? 3 : photos.length;
  const shownPhotos = photos.slice(0, tileCount);
  const mosaic = ({ 1: "", 2: "sm:grid-cols-2 sm:grid-rows-[18rem]", 3: "sm:grid-cols-[2fr_1fr] sm:grid-rows-[9.5rem_9.5rem]",
    5: "sm:grid-cols-[2fr_1fr_1fr] sm:grid-rows-[9.5rem_9.5rem]" } as Record<number, string>)[tileCount] ?? "";
  const extraPhotos = photos.length - shownPhotos.length;

  return <section className="mx-auto flex w-full max-w-3xl flex-col gap-6" aria-labelledby="vendor-packages-title">
    <div className="flex items-center justify-between gap-3">
      <MainButton variant="ghost" size="small" onClick={onBack} className="-ml-2">
        <FiArrowLeft aria-hidden="true" />{backLabel ?? t.vendor.backToMatches}
      </MainButton>
      <ShortlistButton vendorId={vendor.id} serviceId={vendor.serviceId} vendorLabel={vendor.vendorName} variant="labelled" />
    </div>

    {/* The vendor, as one card: photos on top, then who they are and how to reach them. */}
    <div className="overflow-hidden rounded-3xl border border-(--tertiary) bg-white">
    {/* Photos first: couples choose on looks. On phones only the first shows, with a count of the rest. */}
    {shownPhotos.length > 0 && <div className={`grid gap-1.5 ${mosaic}`}>
      {shownPhotos.map((url, index) => {
        const last = index === shownPhotos.length - 1;
        return <button key={url} type="button" onClick={() => setViewing(index)}
          aria-label={index === 0 ? t.vendor.openPhotos(vendor.vendorName, photos.length) : t.vendor.photoOf(index + 1, photos.length)}
          className={`group relative bg-(--secondary) focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white ${index === 0
            ? `h-56 ${tileCount === 1 ? "sm:h-80" : `sm:h-auto ${tileCount > 2 ? "sm:row-span-2" : ""}`}`
            : "max-sm:hidden"}`}>
          <Image src={url} alt="" fill unoptimized sizes={index === 0 ? "(min-width: 640px) 50vw, 100vw" : "25vw"}
            className="object-cover transition-opacity group-hover:opacity-90" onError={() => setFailed((list) => [...list, url])} />
          {last && extraPhotos > 0 && <span aria-hidden="true"
            className="absolute inset-0 grid place-items-center bg-(--positive-tertiary)/55 text-sm font-medium text-white max-sm:hidden">{t.vendor.morePhotos(extraPhotos)}</span>}
          {index === 0 && photos.length > 1 && <span aria-hidden="true"
            className="absolute bottom-3 right-3 rounded-full bg-(--background) px-3 py-1 text-xs font-medium text-(--positive-tertiary) sm:hidden">{t.vendor.morePhotos(photos.length - 1)}</span>}
        </button>;
      })}
    </div>}

    <header className="p-5 sm:p-7">
      <p className="text-sm text-foreground/60">{t.vendor.serviceIn(shownService, places.join(", "))}</p>
      <h1 id="vendor-packages-title" className="libre-font mt-1 wrap-break-word text-3xl leading-tight text-(--positive-tertiary)">{vendor.vendorName}</h1>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-(--positive-tertiary)">
        <FiStar aria-hidden="true" className="text-amber-600" />
        {rating ? <span aria-label={t.vendor.ratingAria(rating)}>{rating}</span> : <span className="text-foreground/60">{t.vendor.notRated}</span>}
      </p>
      {vendor.detail && <p className="mt-4 max-w-[62ch] whitespace-pre-wrap wrap-break-word leading-7 text-foreground/80">{vendor.detail}</p>}
      {(phone || socials.length > 0) && <nav aria-label={t.vendor.socialAria(vendor.vendorName)} className="mt-5 flex flex-wrap gap-2">
        {phone && <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} aria-label={t.vendor.call(phone)}
          className={`${pill} bg-(--positive-tertiary) text-white hover:bg-(--positive-tertiary)/90`}>
          <FiPhone aria-hidden="true" />{phone}
        </a>}
        {socials.map(({ label, url, icon: Icon }) => <a key={label} href={url!} target="_blank" rel="noopener noreferrer"
          aria-label={t.vendor.socialLinkAria(vendor.vendorName, label)}
          className={`${pill} border border-(--tertiary) bg-white text-(--positive-tertiary) hover:bg-(--secondary)`}>
          <Icon aria-hidden="true" />{label}
        </a>)}
      </nav>}
    </header>
    </div>

    {/* The price sheet. */}
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="libre-font text-xl text-(--positive-tertiary)">{fromShortlist ? t.vendor.packagesAll(packages.length) : t.vendor.packagesFit(packages.length)}</h2>
        {packages.length > 1 && <p className="text-xs text-foreground/60">{t.vendor.lowestFirst}</p>}
      </div>
      <p className="mt-1 text-sm text-foreground/60">{inPlan ? t.vendor.chooseHint : t.vendor.notInPlan(shownService)}</p>

      {packages.length === 0
        ? <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-(--tertiary) px-5 py-10 text-center text-sm">
          <BsBoxSeam aria-hidden="true" className="text-2xl text-(--positive-secondary)" />
          <p>{fromShortlist ? t.vendor.noPackages : t.vendor.noMatchedPackages}</p>
        </div>
        : <ul className="mt-4 flex flex-col gap-3">
          {packages.map((pkg) => {
            const chosen = selectedPackage?.packageId === pkg.id;
            const long = (pkg.details?.length ?? 0) > LONG_DETAILS;
            const open = expanded.includes(pkg.id);
            return <motion.li key={pkg.id} layout={reduceMotion ? false : "position"}
              className={`relative isolate rounded-2xl border p-5 transition-colors sm:p-6 ${chosen ? "border-(--positive-tertiary) text-white" : "border-(--tertiary) bg-white"}`}>
              {/* The chosen row fills in plum; the fill fades rather than jumps. */}
              <AnimatePresence initial={false}>
                {chosen && <motion.span key="fill" aria-hidden="true" className="absolute inset-0 -z-10 rounded-2xl bg-(--positive-tertiary)"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} />}
              </AnimatePresence>
              <div className="relative">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="flex min-w-0 items-baseline gap-2 wrap-break-word text-base font-semibold">
                    {chosen && <FiCheck aria-hidden="true" className="shrink-0 translate-y-0.5" />}{pkg.packageName}
                  </h3>
                  <p className={`libre-font shrink-0 whitespace-nowrap text-xl ${chosen ? "" : "text-(--positive-tertiary)"}`}>
                    {currency.format(pkg.price)}{isCatering && <span className="ml-1 font-sans text-xs">{t.vendor.perPax}</span>}
                  </p>
                </div>
                <p className={`mt-1.5 max-w-[60ch] whitespace-pre-wrap wrap-break-word text-sm leading-6 ${chosen ? "text-white/85" : "text-foreground/75"} ${long && !open ? "line-clamp-3" : ""}`}>
                  {pkg.details || t.vendor.noDescription}
                </p>
                {long && <button type="button" aria-expanded={open}
                  onClick={() => setExpanded((list) => open ? list.filter((id) => id !== pkg.id) : [...list, pkg.id])}
                  className={`mt-1 text-sm underline underline-offset-4 ${chosen ? "text-white" : "text-(--positive-tertiary)"}`}>
                  {open ? t.vendor.showLess : t.vendor.showMore}
                </button>}
                <PackageAttachments attachments={pkg.attachments} packageName={pkg.packageName} />
                {inPlan && <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  {chosen && <p className="text-sm text-white/85">{t.vendor.inYourBudget}</p>}
                  <button type="button" aria-pressed={chosen}
                    aria-label={t.vendor.choosePackageAria(pkg.packageName, vendor.vendorName, chosen)}
                    onClick={() => chosen ? removeSelectedPackage(vendor.serviceId) : selectPackage({ serviceId: vendor.serviceId, serviceName,
                      vendorId: vendor.id, vendorName: vendor.vendorName, packageId: pkg.id, packageName: pkg.packageName, unitPrice: Number(pkg.price) })}
                    className={`${pill} ml-auto border ${chosen
                      ? "border-white/40 text-white hover:bg-white/10 focus-visible:outline-white"
                      : "border-(--positive-secondary) bg-white text-(--positive-tertiary) hover:bg-(--secondary)"}`}>
                    {chosen ? t.vendor.removeFromBudget : t.vendor.chooseForBudget}
                  </button>
                </div>}
              </div>
            </motion.li>;
          })}
        </ul>}
    </div>

    <PhotoViewer urls={photos} index={viewing} name={vendor.vendorName} onIndex={setViewing} onClose={() => setViewing(null)} />
  </section>;
}
