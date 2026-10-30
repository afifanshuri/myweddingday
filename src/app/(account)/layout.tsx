import AccountAccessBoundary from "@/components/commonComponents/AccountAccessBoundary";
import AccountNavigation from "@/components/commonComponents/AccountNavigation";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountAccessBoundary><AccountNavigation />{children}</AccountAccessBoundary>;
}
