"use client";

import { useState } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import { APIDeleteAuthSession } from "@/services/api/auth";
import { FiLogOut } from "react-icons/fi";
import { ROUTES } from "@/config/routes";
import { clearLocalPlan, flushPlan } from "@/store/planSync";
import { useT } from "@/i18n";

/** `labelled`: a full-width row with text (the phone menu); otherwise an icon. */
export default function LogoutButton({ labelled = false }: { labelled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const t = useT();

  async function logout() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      // Save any unsaved plan changes first; the account keeps the plan, so this browser's copy is then removed.
      await flushPlan().catch(() => undefined);
      const { error } = await APIDeleteAuthSession();
      if (error) throw error;
      clearLocalPlan();
      // A full navigation also discards cached admin views.
      window.location.replace(ROUTES.home);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return <div className={labelled ? "relative" : "relative ml-auto shrink-0"}>
    {labelled
      ? <MainButton variant="ghost" size="small" disabled={busy} onClick={logout} aria-busy={busy} className="w-full justify-start">
        <FiLogOut aria-hidden="true" /> {busy ? t.nav.loggingOut : t.nav.logOut}
      </MainButton>
      : <MainButton variant="ghost" size="icon" disabled={busy} onClick={logout}
        aria-label={busy ? t.nav.loggingOut : t.nav.logOut} title={t.nav.logOut} aria-busy={busy}>
        <FiLogOut aria-hidden="true" className="size-5" />
      </MainButton>}
    {error && <p role="alert" className="absolute right-0 top-full z-10 mt-2 w-56 rounded-lg border border-(--tertiary) bg-white p-3 text-xs text-red-700">{t.nav.logOutFailed}</p>}
  </div>;
}
