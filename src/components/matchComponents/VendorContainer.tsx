"use client";

import MainButton from "@/components/commonComponents/MainButton";
import Image from "next/image";
import { useState } from "react";
import { VendorAndPackagesMatchDTOType } from "@/types/dtoTypes";
import { SERVICE_ID } from "@/config/serviceCriteria";
import { FaCheck, FaStar } from "react-icons/fa";
import { usePreferenceStore } from "@/store/preferenceStore";

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
}: {
  match: VendorAndPackagesMatchDTOType;
  serviceName: string;
  topPick?: boolean;
  onSelect: (vendorId: number) => void;
}) {
  const prices = match.packages
    .map((pkg) => Number(pkg.price))
    .filter((price) => Number.isFinite(price) && price >= 0);
  const cheapestPrice = prices.length > 0 ? Math.min(...prices) : null;
  const isSelected = usePreferenceStore((state) => state.selectedPackages.some(
    (pkg) => pkg.serviceId === match.vendor.serviceId && pkg.vendorId === match.vendor.id,
  ));
  // Select once per card mount, so hovering or re-rendering does not change the photo.
  const [imageIndex] = useState(() =>
    Math.floor(Math.random() * match.vendor.imageUrls.length),
  );
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = match.vendor.imageUrls[imageIndex];

  return (
    <MainButton
      variant="custom"
      size="none"
      type="button"
      onClick={() => onSelect(match.vendor.id)}
      aria-label={`View packages for ${match.vendor.vendorName}${isSelected ? ", package selected for your budget" : ""}`}
      className={`group flex h-full w-full min-w-0 flex-col items-stretch justify-start overflow-hidden rounded-lg border text-left cursor-pointer transition-colors duration-200 hover:bg-(--secondary) motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary) ${isSelected ? "border-(--positive-tertiary) bg-white" : `hover:border-(--positive-secondary) ${topPick ? "border-(--positive) bg-(--background)" : "border-(--tertiary) bg-white"}`}`}
    >
      <div className="relative flex min-h-44 flex-1 items-center justify-center bg-(--secondary)">
        {imageUrl && !imageFailed ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span
            aria-hidden="true"
            className="libre-font text-5xl text-(--fourth)"
          >
            {match.vendor.vendorName.trim().charAt(0)}
          </span>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent"
        />
        <h3 className="absolute inset-x-0 bottom-0 break-words p-4 text-base font-semibold text-white">
          {match.vendor.vendorName}
        </h3>
        {topPick && (
          <span className="absolute right-3 top-3 rounded-full bg-(--positive) px-2 py-1 text-xs text-(--positive-tertiary)">
            Top pick
          </span>
        )}
        {isSelected && (
          <span aria-hidden="true" className="absolute left-3 top-3 flex size-6 items-center justify-center rounded-full bg-(--background) text-xs text-(--positive-tertiary)">
            <FaCheck />
          </span>
        )}
      </div>
      <div className="flex min-h-44 flex-1 flex-col gap-3 p-4">
        <p className="flex items-center gap-2 text-sm">
          <FaStar aria-hidden="true" className="shrink-0 text-amber-500" />
          {match.vendor.rating == null
            ? "Not rated yet"
            : `${Number(match.vendor.rating).toFixed(1)} / 5`}
        </p>
        <div className="mt-auto border-t border-(--secondary) pt-3">
          <p className="text-xs font-normal">Matched package from</p>
          <p className="mt-1 text-lg font-semibold text-(--positive-tertiary)">
            {cheapestPrice === null
              ? "Price unavailable"
              : currency.format(cheapestPrice)}
            {cheapestPrice !== null &&
              match.vendor.serviceId === SERVICE_ID.CATERING && (
                <span className="ml-1 text-xs font-normal">/ pax</span>
              )}
          </p>
          <p
            aria-hidden="true"
            className="mt-2 text-xs text-(--positive-tertiary) opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100 text-right"
          >
            View packages &rarr;
          </p>
        </div>
      </div>
    </MainButton>
  );
}
