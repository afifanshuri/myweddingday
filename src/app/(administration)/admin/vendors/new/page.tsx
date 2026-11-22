import { Suspense } from "react";
import AdminVendorForm from "@/components/adminComponents/AdminVendorForm";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES } from "@/config/routes";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

async function NewVendorContent() {
  await requireRouteAccess(ROUTES.adminNewVendor);
  return <AdminVendorForm />;
}
export default function NewVendorPage() {
  return <Suspense fallback={<LoadingScreen label="Checking admin access…" />}><NewVendorContent /></Suspense>;
}
