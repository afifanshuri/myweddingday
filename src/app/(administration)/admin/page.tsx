import { Suspense } from "react";
import AdminVendorForm from "@/components/adminComponents/AdminVendorForm";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES } from "@/config/routes";

async function AdminContent() {
  await requireRouteAccess(ROUTES.admin);
  return <AdminVendorForm />;
}
export default function AdminPage() {
  return <Suspense fallback={<p role="status" className="p-6">Checking admin access…</p>}><AdminContent /></Suspense>;
}
