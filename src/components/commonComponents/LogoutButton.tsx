"use client";

import { useState } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import { APIDeleteAuthSession } from "@/services/api/auth";
import { FiLogOut } from "react-icons/fi";
import { ROUTES } from "@/config/routes";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await APIDeleteAuthSession();
      if (error) throw error;
      // A full navigation also discards cached admin views.
      window.location.replace(ROUTES.home);
    } catch {
      setError("Unable to log out. Please try again.");
      setBusy(false);
    }
  }

  return <div className="relative ml-auto shrink-0">
    <MainButton variant="ghost" size="icon" disabled={busy} onClick={logout}
      aria-label={busy ? "Logging out" : "Log out"} title="Log out" aria-busy={busy}>
      <FiLogOut aria-hidden="true" className="size-5" />
    </MainButton>
    {error && <p role="alert" className="absolute right-0 top-full z-10 mt-2 w-56 rounded-lg border border-(--tertiary) bg-white p-3 text-xs text-red-700">{error}</p>}
  </div>;
}
