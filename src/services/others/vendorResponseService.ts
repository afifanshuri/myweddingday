import type { VendorAndPackagesMatchDTOType, VendorMatchResult } from "@/types/dtoTypes";

/**
 * What a customer receives for one vendor. Full: everything except admin review fields. Locked: a preview only
 * (photos, rating, cheapest price), never names, contacts, package details or attachments.
 */
export function projectVendorMatch(match: VendorAndPackagesMatchDTOType, unlocked: boolean): VendorMatchResult {
  if (unlocked) {
    // Review fields are for admins only; customers only ever see approved vendors.
    const { status: _status, reviewNote: _reviewNote, reviewedAt: _reviewedAt, ...vendor } = match.vendor;
    return { ...match, vendor, identityLocked: false } as VendorMatchResult;
  }
  const prices = match.packages.map((pkg) => Number(pkg.price)).filter((price) => Number.isFinite(price) && price >= 0);
  return {
    identityLocked: true,
    vendor: { id: match.vendor.id, serviceId: match.vendor.serviceId, rating: match.vendor.rating, imageUrls: match.vendor.imageUrls },
    cheapestPrice: prices.length ? Math.min(...prices) : null,
  };
}
