"use client";
import { useServiceStore } from "@/store/serviceStore";
import { usePathname } from "next/navigation";
import MainButton from "../commonComponents/MainButton";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useRouter } from "next/navigation";
import { ROUTES, serviceCriteriaRoute } from "@/config/routes";
import { useRef } from "react";

export default function DirectionButtons() {
  const router = useRouter();
  const submitted = useRef(false);
  const currentPath = usePathname();
  const serviceChoiceList = usePreferenceStore(
    (state) => state.weddingDetails.services,
  );
  const currentServicePlanPage = useServiceStore(
    (state) => state.currentActiveServicePage,
  );
  const changePage = (direction: string) => {
    const mainPage = ROUTES.weddingPlan;
    const matchPage = ROUTES.match;
    const currIndex = serviceChoiceList.findIndex(
      (e) => e === currentServicePlanPage,
    );
    const nextPath =
      direction === "back"
        ? currentPath === ROUTES.weddingPlan
          ? ROUTES.home
          : currIndex - 1 < 0
            ? mainPage
            : serviceCriteriaRoute(serviceChoiceList[currIndex - 1])
        : currIndex + 1 > serviceChoiceList.length - 1
          ? matchPage
          : serviceCriteriaRoute(serviceChoiceList[currIndex + 1]);
    if (nextPath === matchPage) {
      if (submitted.current) return;
      submitted.current = true;
      usePreferenceStore.getState().beginManualSearch();
    }
    router.push(nextPath);
  };
  return (
    <div className="flex flex-row gap-4 justify-end">
      <MainButton variant="secondary" onClick={() => changePage("back")}>Back</MainButton>
      <MainButton onClick={() => changePage("next")}>Continue</MainButton>
    </div>
  );
}
