/**
 * Opens a vendor's page in the results (the same view as clicking a vendor card) from elsewhere on the results page,
 * e.g. the budget panel. The results page registers its opener while it's mounted, so history (Back) stays right.
 */
let opener: ((vendorId: number) => void) | null = null;

export function registerVendorOpener(open: ((vendorId: number) => void) | null) { opener = open; }
export function openVendorPage(vendorId: number) { opener?.(vendorId); }
