"use client";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import MainButton from "@/components/commonComponents/MainButton";
import { ROUTES } from "@/config/routes";

export default function AdminAccessBoundary({ children }: { children: React.ReactNode }) {
  const { access, checking } = useAccountAccess();
  if (checking) return <p role="status" className="p-6">Checking account access…</p>;
  if (access.role !== "admin") return <div className="p-6"><p>Admin access is required.</p><MainButton href={access.userId ? ROUTES.dashboard : ROUTES.login} variant="link">{access.userId ? "Back to dashboard" : "Sign in"}</MainButton></div>;
  return children;
}
