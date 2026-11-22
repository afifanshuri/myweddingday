import { Suspense } from "react";
import { notFound } from "next/navigation";
import AdminVendorForm from "@/components/adminComponents/AdminVendorForm";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { adminVendorRoute } from "@/config/routes";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

async function EditVendorContent({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  if (!/^[1-9]\d{0,9}$/.test(vendorId) || Number(vendorId) > 2147483647) notFound();
  await requireRouteAccess(adminVendorRoute(Number(vendorId)));
  return <AdminVendorForm vendorId={Number(vendorId)} />;
}
export default function EditVendorPage({ params }: { params: Promise<{ vendorId: string }> }) {
  return <Suspense fallback={<LoadingScreen label="Checking admin access…" />}><EditVendorContent params={params} /></Suspense>;
}
