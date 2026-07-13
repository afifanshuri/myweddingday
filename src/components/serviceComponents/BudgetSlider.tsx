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
      case 1:
        return state.venuePreference;
      case 2:
        return state.pelaminPreference;
      case 3:
        return state.cateringPreference;
      case 4:
        return state.photographerPreference;
      default:
        return {
          serviceId: 0,
          budget: 0,
          description: "",
          style: [],
        };
    }
  }

  const preferenceStore = usePreferenceStore((state) =>
    getPreferenceStoreById(currentPath, state),
  );

  const budgetSetter = usePreferenceStore((state) => state.setBudget);

  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <div className="flex flex-row justify-between items-center">
        <p>Your Budget</p>
        <div className="flex flex-row items-center gap-2 justify-end">
          <p>RM</p>
          <CustomInput
            defaultValue={preferenceStore.budget}
            type="number"
            className="w-1/2"
            onChange={(e) => budgetSetter(currentPath, Number(e.target.value))}
          ></CustomInput>
        </div>
      </div>
    </div>
  );
};
