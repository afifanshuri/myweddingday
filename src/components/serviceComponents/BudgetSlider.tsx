import { SERVICE_ID } from "@/constants/commonConstants";
import CustomInput from "../commonComponents/CustomInput";
import {
  PreferenceStore,
  usePreferenceStore,
} from "@/app/store/preferenceStore";

export const BudgetSlider = ({
  currentPath,
  className = "",
}: {
  currentPath: number;
  className: string;
}) => {
  function getPreferenceStoreById(id: number, state: PreferenceStore) {
    switch (id) {
      case SERVICE_ID.VENUE:
        return state.venuePreference.budget;
      case SERVICE_ID.PELAMIN:
        return state.pelaminPreference.budget;
      case SERVICE_ID.CATERING:
        return state.cateringPreference.budget;
      case SERVICE_ID.PHOTOGRAPHER:
        return state.photographerPreference.budget;
      case SERVICE_ID.MUA:
        return state.muaPreference.budget;
      case SERVICE_ID.CLOTHING:
        return state.clothingPreference.budget;
      default:
        throw new Error(`Unknown service id: ${id}`);
    }
  }

  const budget = usePreferenceStore((state) =>
    getPreferenceStoreById(currentPath, state),
  );

  const updateBudget = usePreferenceStore((state) => state.updatePreferenceDetails);

  return (
    <div
      className={`rounded-lg p-4 ${className} bg-white border border-(--positive) text-(--positive-tertiary) shadow-sm`}
    >
      <div className="flex flex-row justify-between items-center">
        <p>Your Budget</p>
        <div className="flex flex-row items-center justify-end">
          <p>RM</p>
          <CustomInput
            defaultValue={budget}
            type="number"
            className="w-1/3"
            onChange={(e) => updateBudget(currentPath, {budget: Number(e.target.value)})}
          ></CustomInput>
          <p className={`${currentPath == SERVICE_ID.CATERING ? "flex" : "hidden"}`}>per pax</p>
        </div>
      </div>
    </div>
  );
};
