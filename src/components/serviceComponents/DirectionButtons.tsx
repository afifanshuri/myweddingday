"use client";
import { useServiceStore } from "@/app/store/serviceStore";
import { usePathname } from "next/navigation";
import MainButton from "../commonComponents/MainButton";

export default function DirectionButtons() {
  const currentPath = usePathname();
  const serviceChoiceList = useServiceStore((state) => state.selectedService);
  const currentServicePlanPage = useServiceStore(
    (state) => state.currentActiveServicePage,
  );
  const changePage = (direction: string) => {
    const mainPage = "/weddingplan";
    const matchPage = "/match";
    const currIndex = serviceChoiceList.findIndex(
      (e) => e === currentServicePlanPage,
    );
    return direction === "back"
      ? currentPath === "/weddingplan"
        ? "/"
        : currIndex - 1 < 0
          ? mainPage
          : `${mainPage}/${serviceChoiceList[currIndex - 1]}`
      : currIndex + 1 > serviceChoiceList.length - 1
        ? matchPage
        : `${mainPage}/${serviceChoiceList[currIndex + 1]}`;
  };
  return (
    <div className="flex flex-row gap-4 justify-end">
      <MainButton href={`${changePage("back")}`}>Back</MainButton>
      <MainButton href={`${changePage("next")}`}>Continue</MainButton>
    </div>
  );
}
