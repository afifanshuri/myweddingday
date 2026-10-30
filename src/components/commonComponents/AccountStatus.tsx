"use client";
import { useAccountAccess } from "./AccountAccessProvider";

export default function AccountStatus() {
  const { access, checking } = useAccountAccess();
  if (checking) return <span className="text-xs">Checking account...</span>;
  return <span className="text-xs">
    {access.userId ? `${access.role === "admin" ? "Admin" : "User"} · ${access.isPaid ? "Paid" : "Free"}` : "Guest · Free"}
    {access.paidUntil && access.isPaid && ` · Until ${new Date(access.paidUntil).toLocaleDateString("en-MY")}`}
  </span>;
}
