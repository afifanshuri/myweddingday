"use client";
import { useAccountAccess } from "./AccountAccessProvider";
import MainButton from "./MainButton";
import { ROUTES } from "@/config/routes";

export default function AccountAccessBoundary({ children }: { children: React.ReactNode }) {
  const { access, checking } = useAccountAccess();
  if (checking) return <p role="status" className="p-6">Checking account access…</p>;
  if (!access.userId) return <div className="p-6"><p>Sign in to continue.</p><MainButton href={ROUTES.login} variant="link">Sign in</MainButton></div>;
  return children;
}
