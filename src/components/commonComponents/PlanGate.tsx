"use client";

import type { ReactNode } from "react";
import LoadingScreen from "./LoadingScreen";
import MainButton from "./MainButton";
import { useAccountAccess } from "./AccountAccessProvider";
import { retryPlanLoad, usePlanStatus } from "@/store/planSync";

/** Holds a page that reads the plan until the signed-in user's saved plan has been loaded into the browser. */
export default function PlanGate({ children }: { children: ReactNode }) {
  const { access, checking } = useAccountAccess();
  const { userId, status } = usePlanStatus();
  // Guests have no saved plan; pages handle the access check themselves.
  if (checking || !access.userId) return children;
  if (status === "error" && userId === access.userId) {
    return <div role="alert" className="fixed inset-0 z-50 grid place-items-center bg-background p-6">
      <div className="max-w-sm text-center text-sm text-(--positive-tertiary)">
        <p>We couldn&apos;t load your saved plan. Check your connection and try again.</p>
        <MainButton className="mt-4" onClick={retryPlanLoad}>Try again</MainButton>
      </div>
    </div>;
  }
  if (userId !== access.userId || status !== "ready") return <LoadingScreen label="Loading your plan…" />;
  return children;
}
