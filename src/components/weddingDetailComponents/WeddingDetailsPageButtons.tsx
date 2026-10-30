"use client";
import { useServiceStore } from "@/store/serviceStore";
import MainButton from "../commonComponents/MainButton";
import { useRouter } from "next/navigation";
import { usePreferenceStore } from "@/store/preferenceStore";
import { validateWeddingDetails } from "@/services/others/fieldValidationService";
import { ROUTES, serviceCriteriaRoute } from "@/config/routes";

export default function WeddingDetailsPageButtons(onSubmit: () => boolean) {
  const weddingDetailsFromStore = usePreferenceStore(
    (state) => state.weddingDetails,
  );
  const selectedServicesFromStore = useServiceStore(
    (state) => state.selectedService,
  );

  const router = useRouter();
  const onSubmitChoice = () => {
    validateWeddingDetails(weddingDetailsFromStore);
    if (selectedServicesFromStore.length !== 0) {
      router.push(serviceCriteriaRoute(selectedServicesFromStore[0]));
    }
  };

  const onGoBack = () => {
    router.push(ROUTES.home);
  };
  return (
    <div className="flex justify-end gap-2">
      <MainButton variant="secondary" onClick={() => onGoBack()}>Back</MainButton>
      <MainButton onClick={onSubmitChoice}>Continue</MainButton>
    </div>
  );
}
