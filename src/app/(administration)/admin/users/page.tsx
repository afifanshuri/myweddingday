import { Suspense } from "react";
import AdminUsersPanel from "@/components/adminComponents/AdminUsersPanel";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES } from "@/config/routes";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

async function UsersContent() {
  await requireRouteAccess(ROUTES.adminUsers);
  return <AdminUsersPanel />;
}
export default function UsersPage() {
  return <Suspense fallback={<LoadingScreen label="Checking admin access…" />}><UsersContent /></Suspense>;
}
