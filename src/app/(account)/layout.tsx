import AccountAccessBoundary from "@/components/commonComponents/AccountAccessBoundary";
import AccountNavigation from "@/components/commonComponents/AccountNavigation";
import PlanGate from "@/components/commonComponents/PlanGate";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountAccessBoundary><AccountNavigation /><PlanGate>{children}</PlanGate></AccountAccessBoundary>;
}
