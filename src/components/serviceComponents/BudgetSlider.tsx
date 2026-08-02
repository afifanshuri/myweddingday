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
  const budget = usePreferenceStore((state) => state.preferencesList.find((preference) => preference.serviceId === currentPath)?.budget);
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
