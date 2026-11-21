import { Suspense } from "react";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES } from "@/config/routes";
import VendorLookupPage from "@/components/vendorLookupComponents/VendorLookupPage";

async function VendorSearchContent() {
  // Guests go to login; signed-in users without Plus go to payment.
  await requireRouteAccess(ROUTES.vendorSearch);
  return <VendorLookupPage />;
}

export default function VendorSearchPage() {
  return <Suspense fallback={<p role="status" className="p-6">Checking account access…</p>}>
    <VendorSearchContent />
  </Suspense>;
}
