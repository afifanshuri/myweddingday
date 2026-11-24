"use client";

import MainButton from "@/components/commonComponents/MainButton";
import Image from "next/image";
import { useState } from "react";
import { VendorMatchResult } from "@/types/dtoTypes";
import LockedVendorDetail from "@/components/commonComponents/LockedVendorDetail";
import { SERVICE_ID } from "@/config/serviceCriteria";
import { FaCheck, FaLock, FaStar } from "react-icons/fa";
import { usePreferenceStore } from "@/store/preferenceStore";
import ShortlistButton from "./ShortlistButton";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const currency = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function VendorContainer({
  match,
  serviceName,
  topPick = false,
  onSelect,
  priceLabel = "Matched package from",
}: {
  match: VendorMatchResult;
  serviceName: string;
  topPick?: boolean;
  onSelect: (vendorId: number) => void;
  priceLabel?: string;
}) {
  const prices = (match.identityLocked ? [] : match.packages)
    .map((pkg) => Number(pkg.price))
    .filter((price) => Number.isFinite(price) && price >= 0);
  const cheapestPrice = match.identityLocked ? match.cheapestPrice : prices.length > 0 ? Math.min(...prices) : null;
  const isSelected = usePreferenceStore((state) => state.selectedPackages.some(
    (pkg) => pkg.serviceId === match.vendor.serviceId && pkg.vendorId === match.vendor.id,
  ));
  const reduceMotion = useReducedMotion();
  // Select once per card mount, so hovering or re-rendering does not change the photo.
  const [imageIndex] = useState(() =>
    Math.floor(Math.random() * match.vendor.imageUrls.length),
  );
  const imageUrl = match.vendor.imageUrls[imageIndex];
  // Remember which link failed, so a reloaded (re-signed) link is tried again.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imageFailed = !!imageUrl && failedUrl === imageUrl;

  const content = (
    <>
      <div className="relative flex min-h-32 flex-1 items-center justify-center bg-(--secondary) sm:min-h-44">
        {imageUrl && !imageFailed ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1280px) 25vw, 50vw"
            className="object-cover"
            onError={() => setFailedUrl(imageUrl)}
          />
        ) : (
          <span
            aria-hidden="true"
            className="libre-font text-5xl text-(--fourth)"
          >
            {match.identityLocked ? "♡" : match.vendor.vendorName.trim().charAt(0)}
          </span>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent"
        />
        <h3 className="absolute inset-x-0 bottom-0 wrap-break-word p-3 text-sm font-semibold text-white sm:p-4 sm:text-base">
          {match.identityLocked ? <LockedVendorDetail /> : match.vendor.vendorName}
        </h3>
        {/* Top left: what this vendor is to you. "In budget" (a chosen package) is solid; the shortlist bookmark sits apart, top right. */}
        <div className="absolute left-2 top-2 flex flex-wrap items-center gap-1 pr-10 sm:left-3 sm:top-3 sm:gap-1.5 sm:pr-12">
          {match.identityLocked && (
            <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-black/35 text-xs text-white">
              <FaLock />
            </span>
          )}
          {!match.identityLocked && isSelected && (
            <span className="flex items-center gap-1.5 rounded-full bg-(--positive-tertiary) px-2 py-1 text-[0.7rem] font-medium text-white sm:px-2.5 sm:text-xs">
              <FaCheck aria-hidden="true" />
              In budget
            </span>
          )}
          {topPick && (
            <span className="rounded-full bg-(--positive) px-2 py-1 text-[0.7rem] text-(--positive-tertiary) sm:text-xs">
              Top pick
            </span>
          )}
        </div>
      </div>
      <div className="flex min-h-36 flex-1 flex-col gap-2 p-3 sm:min-h-44 sm:gap-3 sm:p-4">
        {match.identityLocked && <div className="text-xs text-foreground/50"><LockedVendorDetail contact /></div>}
        <p className="flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
          <FaStar aria-hidden="true" className="shrink-0 text-amber-500" />
          {match.vendor.rating == null
            ? "Not rated yet"
            : `${Number(match.vendor.rating).toFixed(1)} / 5`}
        </p>
        <div className="mt-auto border-t border-(--secondary) pt-2 sm:pt-3">
          <p className="text-xs font-normal">{priceLabel}</p>
          <p className="mt-1 text-base font-semibold text-(--positive-tertiary) sm:text-lg">
            {cheapestPrice === null
              ? "Price unavailable"
              : currency.format(cheapestPrice)}
            {cheapestPrice !== null &&
              match.vendor.serviceId === SERVICE_ID.CATERING && (
                <span className="ml-1 text-xs font-normal">/ pax</span>
              )}
          </p>
          {!match.identityLocked && <p
            aria-hidden="true"
            className="mt-2 text-xs text-(--positive-tertiary) opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100 text-right"
          >
            View packages &rarr;
          </p>}
        </div>
      </div>
    </>
  );
  const base = "flex h-full w-full min-w-0 flex-col items-stretch justify-start overflow-hidden rounded-lg border text-left";
  // The bookmark is a sibling of the card (not inside the card's button), so each stays a separate control.
  const shortlist = <div className="absolute right-2 top-2 z-10 sm:right-3 sm:top-3">
    <ShortlistButton vendorId={match.vendor.id} serviceId={match.vendor.serviceId}
      vendorLabel={match.identityLocked ? `this ${serviceName.toLowerCase()} vendor` : match.vendor.vendorName} />
  </div>;
  if (match.identityLocked) return <div className="relative h-full">
    <article aria-label={`${serviceName} vendor preview, details locked`} className={`${base} border-(--tertiary) bg-white`}>{content}</article>
    {shortlist}
  </div>;
  return <div className="relative isolate h-full">
    {/* A chosen vendor glows softly, like candlelight behind the card: it fades in when a package is chosen and gently breathes. */}
    <AnimatePresence>
      {isSelected && <motion.div key="glow" aria-hidden="true"
        className="pointer-events-none absolute -inset-1 -z-10 rounded-xl bg-linear-to-br from-(--positive) via-(--positive-secondary) to-(--positive-tertiary) blur-md"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={reduceMotion ? { opacity: 0.5, scale: 1 } : { opacity: [0.4, 0.7, 0.4], scale: 1 }}
        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
        transition={reduceMotion ? { duration: 0 } : { opacity: { duration: 3.2, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.4 } }} />}
    </AnimatePresence>
    <MainButton variant="custom" size="none" onClick={() => onSelect(match.vendor.id)}
    aria-label={`View packages for ${match.vendor.vendorName}${isSelected ? ", package selected for your budget" : ""}`}
    className={`${base} group cursor-pointer transition-colors duration-200 hover:bg-(--secondary) motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary) ${isSelected ? "border-(--positive-tertiary) bg-white" : `hover:border-(--positive-secondary) ${topPick ? "border-(--positive) bg-(--background)" : "border-(--tertiary) bg-white"}`}`}>
    {content}
  </MainButton>{shortlist}</div>;
}
