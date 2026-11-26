"use client";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";
import { useAccountAccess } from "./AccountAccessProvider";
import MainButton from "./MainButton";
import { ROUTES } from "@/config/routes";
import { useT } from "@/i18n";

export default function AccountAccessBoundary({ children }: { children: React.ReactNode }) {
  const { access, checking } = useAccountAccess();
  const t = useT();
  if (checking) return <LoadingScreen label="Checking account access…" />;
  if (!access.userId) return <div className="p-6"><p>{t.common.signInToContinue}</p><MainButton href={ROUTES.login} variant="link">{t.common.signIn}</MainButton></div>;
  return children;
}
