import type { VendorAndPackagesMatchDTOType, VendorMatchResult } from "@/types/dtoTypes";
import { PLANS } from "@/config/plans";

export function projectVendorMatch(match: VendorAndPackagesMatchDTOType, unlocked: boolean): VendorMatchResult {
  if (unlocked) return { ...match, identityLocked: false };
  const prices = match.packages.map((pkg) => Number(pkg.price)).filter((price) => Number.isFinite(price) && price >= 0);
  return {
    identityLocked: true,
    vendor: { id: match.vendor.id, serviceId: match.vendor.serviceId, rating: match.vendor.rating, imageUrls: match.vendor.imageUrls },
    cheapestPrice: prices.length ? Math.min(...prices) : null,
  };
}

export function projectVendorMatches(matches: VendorAndPackagesMatchDTOType[], unlocked: boolean): VendorMatchResult[] {
  if (unlocked) return matches.map((match) => projectVendorMatch(match, true));
  const seenServices = new Set<number>();
  const topMatches = matches.filter((match) => {
    if (seenServices.has(match.vendor.serviceId)) return false;
    seenServices.add(match.vendor.serviceId);
    return true;
  });
  const seenVendors = new Set<number>();
  const previews = [...topMatches, ...matches].filter((match) => {
    if (seenVendors.has(match.vendor.id)) return false;
    seenVendors.add(match.vendor.id);
    return true;
  });
  const limit = PLANS.free.vendorPreviews;
  return (limit === null ? previews : previews.slice(0, limit)).map((match) => projectVendorMatch(match, false));
}
