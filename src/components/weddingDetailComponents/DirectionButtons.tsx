"use client";
import { useServiceStore } from "@/store/serviceStore";
import { usePathname } from "next/navigation";
import MainButton from "../commonComponents/MainButton";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useRouter } from "next/navigation";
import { ROUTES, paymentRoute, serviceCriteriaRoute } from "@/config/routes";
import { useAccountAccess } from "../commonComponents/AccountAccessProvider";
import { useFreeSearchUsed } from "@/store/searchUsage";
import { useRef, type ReactNode } from "react";
import { useT } from "@/i18n";

/** `children` (e.g. a page's Reset button) sits just before Back. */
export default function DirectionButtons({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const { access, checking } = useAccountAccess();
  const freeSearchUsed = useFreeSearchUsed(access, checking);
  const submitted = useRef(false);
  const t = useT();
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
  // The last step starts a search. A free account that has used its one search is offered Plus instead.
  const lastStep = currentPath !== ROUTES.weddingPlan
    && serviceChoiceList.findIndex((e) => e === currentServicePlanPage) >= serviceChoiceList.length - 1;
  return (
    <div className="flex flex-row flex-wrap items-center gap-4 justify-end">
      {lastStep && freeSearchUsed && <p className="text-sm text-foreground/70">{t.planner.usedFreeSearch}</p>}
      {children}
      <MainButton variant="secondary" onClick={() => changePage("back")}>{t.common.back}</MainButton>
      {lastStep && freeSearchUsed
        ? <MainButton href={paymentRoute(ROUTES.match)}>{t.planner.getPlusToSearch}</MainButton>
        : <MainButton onClick={() => changePage("next")}>{t.common.continue}</MainButton>}
    </div>
  );
}
