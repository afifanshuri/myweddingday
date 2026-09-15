"use client";
import { useServiceStore } from "@/store/serviceStore";
import { usePathname } from "next/navigation";
import MainButton from "../commonComponents/MainButton";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useRouter } from "next/navigation";

export default function DirectionButtons() {
  const router = useRouter();
  const currentPath = usePathname();
  const serviceChoiceList = usePreferenceStore(
    (state) => state.weddingDetails.services,
  );
  const currentServicePlanPage = useServiceStore(
    (state) => state.currentActiveServicePage,
  );
  const changePage = (direction: string) => {
    const mainPage = "/weddingplan";
    const matchPage = "/match";
    const currIndex = serviceChoiceList.findIndex(
      (e) => e === currentServicePlanPage,
    );
    const nextPath =
      direction === "back"
        ? currentPath === "/weddingplan"
          ? "/"
          : currIndex - 1 < 0
            ? mainPage
            : `${mainPage}/${serviceChoiceList[currIndex - 1]}`
        : currIndex + 1 > serviceChoiceList.length - 1
          ? matchPage
          : `${mainPage}/${serviceChoiceList[currIndex + 1]}`;
    router.push(nextPath);
  };
  return (
    <div className="flex flex-row gap-4 justify-end">
      <MainButton onClick={() => changePage("back")}>Back</MainButton>
      <MainButton onClick={() => changePage("next")}>Continue</MainButton>
    </div>
  );
}
