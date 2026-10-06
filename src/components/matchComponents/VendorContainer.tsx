import MainButton from "@/components/commonComponents/MainButton";
import { VendorAndPackagesMatchDTOType } from "@/types/dtoTypes";
import { SERVICE_ID } from "@/config/serviceCriteria";
import { FaStar } from "react-icons/fa";

const currency = new Intl.NumberFormat("en-MY", {
  style: "currency", currency: "MYR", minimumFractionDigits: 0, maximumFractionDigits: 2,
});

export default function VendorContainer({ match, serviceName, topPick = false, onSelect }: {
  match: VendorAndPackagesMatchDTOType;
  serviceName: string;
  topPick?: boolean;
  onSelect: (vendorId: number) => void;
}) {
  const prices = match.packages.map((pkg) => Number(pkg.price))
    .filter((price) => Number.isFinite(price) && price >= 0);
  const cheapestPrice = prices.length > 0 ? Math.min(...prices) : null;

  return (
    <MainButton variant="custom" size="none"
      type="button"
      onClick={() => onSelect(match.vendor.id)}
      aria-label={`View packages for ${match.vendor.vendorName}`}
      className={`flex h-full w-full min-w-0 flex-col items-stretch justify-start gap-4 rounded-lg border p-4 text-left cursor-pointer transition hover:border-(--positive) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary) ${topPick ? "border-(--positive) bg-(--background)" : "border-(--tertiary) bg-white"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-(--positive-tertiary)">{serviceName}</p>
        {topPick && <span className="rounded-full bg-(--positive) px-2 py-1 text-xs">Top pick</span>}
      </div>
      <h3 className="break-words text-base font-semibold">{match.vendor.vendorName}</h3>
      <p className="flex items-center gap-2 text-sm">
        <FaStar aria-hidden="true" className="shrink-0 text-amber-500" />
        {match.vendor.rating == null ? "Not rated yet" : `${Number(match.vendor.rating).toFixed(1)} / 5`}
      </p>
      <div className="mt-auto border-t border-(--secondary) pt-3">
        <p className="text-xs font-normal">Matched package from</p>
        <p className="mt-1 text-lg font-semibold text-(--positive-tertiary)">
          {cheapestPrice === null ? "Price unavailable" : currency.format(cheapestPrice)}
          {cheapestPrice !== null && match.vendor.serviceId === SERVICE_ID.CATERING && (
            <span className="ml-1 text-xs font-normal">/ pax</span>
          )}
        </p>
      </div>
    </MainButton>
  );
}
