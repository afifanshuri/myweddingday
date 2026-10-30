import { Suspense } from "react";
import AdminUsersPanel from "@/components/adminComponents/AdminUsersPanel";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES } from "@/config/routes";

async function UsersContent() {
  await requireRouteAccess(ROUTES.adminUsers);
  return <AdminUsersPanel />;
}
export default function UsersPage() {
  return <Suspense fallback={<p role="status" className="p-6">Checking admin access…</p>}><UsersContent /></Suspense>;
}
