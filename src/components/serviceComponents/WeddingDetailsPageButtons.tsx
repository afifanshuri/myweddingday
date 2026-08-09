"use client";
import { useServiceStore } from "@/app/store/serviceStore";
import MainButton from "../commonComponents/MainButton";
import { useRouter } from "next/navigation";
import { usePreferenceStore } from "@/app/store/preferenceStore";
import { validateWeddingDetails } from "@/services/fieldValidationService";

export default function WeddingDetailsPageButtons(onSubmit: () => boolean) {
  const deleteAllServicesFromStore = useServiceStore(
    (state) => state.deleteAllService,
  );
  const deleteAllPreferenceData = usePreferenceStore(
    (state) => state.deleteAllPreferenceData,
  );
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
      router.push(`/weddingplan/${selectedServicesFromStore[0]}`);
    }
  };

  const onGoBack = () => {
    deleteAllServicesFromStore();
    deleteAllPreferenceData();
    router.push("/");
  };
  return (
    <div className="flex justify-end gap-2">
      <MainButton onClick={() => onGoBack()}>Back</MainButton>
      <MainButton onClick={onSubmitChoice}>Continue</MainButton>
    </div>
  );
}
