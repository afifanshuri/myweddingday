import { Suspense } from "react";
import AdminVendorList from "@/components/adminComponents/AdminVendorList";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES } from "@/config/routes";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

async function AdminContent() {
  await requireRouteAccess(ROUTES.admin);
  return <AdminVendorList />;
}
export default function AdminPage() {
  return <Suspense fallback={<LoadingScreen label="Checking admin access…" />}><AdminContent /></Suspense>;
}
