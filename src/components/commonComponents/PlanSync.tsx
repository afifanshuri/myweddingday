"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useAccountAccess } from "./AccountAccessProvider";
import { clearLocalPlan, startPlanSync, stopPlanSync, usePlanStatus } from "@/store/planSync";

/** Mounted once for the whole app: syncs the signed-in user's plan with their account and shows sync notices. */
export default function PlanSync() {
  const { access, checking } = useAccountAccess();
  const userId = checking ? undefined : access.userId;

  useEffect(() => {
    // While access is being checked, or if the check failed, keep the browser's plan as it is (it may hold unsaved changes).
    if (!userId) return;
    startPlanSync(userId);
    return () => stopPlanSync();
  }, [userId]);

  useEffect(() => {
    const subscription = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") clearLocalPlan();
    });
    return () => subscription.data.subscription.unsubscribe();
  }, []);

  const notice = usePlanStatus((state) => state.notice);
  if (!notice) return null;
  return <div role="status" className="fixed inset-x-0 bottom-4 z-60 mx-auto flex w-[min(32rem,calc(100%-2rem))] items-start gap-3 rounded-xl border border-(--tertiary) bg-white p-4 text-sm text-(--positive-tertiary) shadow-lg">
    <p className="flex-1">{notice}</p>
    <button type="button" onClick={() => usePlanStatus.setState({ notice: null })} aria-label="Dismiss" className="shrink-0 rounded p-1 hover:bg-(--tertiary)/40">
      <FiX aria-hidden="true" />
    </button>
  </div>;
}
