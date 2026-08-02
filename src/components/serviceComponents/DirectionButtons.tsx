"use client";
import { useServiceStore } from "@/app/store/serviceStore";
import { usePathname } from "next/navigation";
import MainButton from "../commonComponents/MainButton";
import { savePreferencesDetails } from "@/services/preferencesService";
import { usePreferenceStore } from "@/app/store/preferenceStore";
import { BasicPreferenceType } from "@/types/preferenceTypes";
import { useRouter } from "next/navigation";

export default function DirectionButtons() {
  const router = useRouter();
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
    const nextPath = direction === "back"
      ? currentPath === "/weddingplan"
        ? "/"
        : currIndex - 1 < 0
          ? mainPage
          : `${mainPage}/${serviceChoiceList[currIndex - 1]}`
      : currIndex + 1 > serviceChoiceList.length - 1
        ? matchPage
        : `${mainPage}/${serviceChoiceList[currIndex + 1]}`;
        console.log("nextPath", nextPath);
    if(nextPath === matchPage) {
      const preferencesList:BasicPreferenceType[] = [];
      for(const id of serviceChoiceList) {
        const preference = usePreferenceStore.getState().preferencesList.find((p) => p.serviceId == id);
        if(preference) {
          preferencesList.push(preference);
        }
      }
      savePreferencesDetails(preferencesList);
    }
    router.push(nextPath);

  };
  return (
    <div className="flex flex-row gap-4 justify-end">
      <MainButton onClick={() => changePage("back")}>Back</MainButton>
      <MainButton onClick={() => changePage("next")}>Continue</MainButton>
    </div>
  );
}
