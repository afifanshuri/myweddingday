import AccountAccessBoundary from "@/components/commonComponents/AccountAccessBoundary";
import AccountNavigation from "@/components/commonComponents/AccountNavigation";
import PlanGate from "@/components/commonComponents/PlanGate";

// Account pages show only to a signed-in user (checked in the browser and again on the server), so there is no
// signed-out shell for Next.js to validate as an instant navigation.
export const instant = false;

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountAccessBoundary><AccountNavigation /><PlanGate>{children}</PlanGate></AccountAccessBoundary>;
}
