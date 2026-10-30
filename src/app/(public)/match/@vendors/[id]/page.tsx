import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES, vendorMatchRoute } from "@/config/routes";

type Props = { params: Promise<{ id: string }> };
async function ProtectedVendorPage({ params }: Props) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) > 2147483647) notFound();
  await requireRouteAccess(vendorMatchRoute(Number(id)));
  // Packages are opened within the current match results, preserving their criteria.
  return redirect(ROUTES.match);
}

export default function VendorDetailPage(props: Props) {
  return <Suspense fallback={<p role="status">Checking account access…</p>}><ProtectedVendorPage {...props} /></Suspense>;
}
