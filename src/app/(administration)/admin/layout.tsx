import { ROUTES } from "@/config/routes";
import MainButton from "@/components/commonComponents/MainButton";
import AdminAccessBoundary from "@/components/adminComponents/AdminAccessBoundary";
import AccountNavigation from "@/components/commonComponents/AccountNavigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAccessBoundary>
    <AccountNavigation>
      <MainButton href={ROUTES.admin} variant="ghost" size="small">Vendors</MainButton>
      <MainButton href={ROUTES.adminUsers} variant="ghost" size="small">Users & access</MainButton>
    </AccountNavigation>
    {children}
  </AdminAccessBoundary>;
}
