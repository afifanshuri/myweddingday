"use client"
import { PreferenceStore, usePreferenceStore } from "@/app/store/preferenceStore";
import { SERVICE_ID } from "@/constants/commonConstants";
import CustomTextarea from "../commonComponents/CustomTextarea";

const PromptTextbox = ({currentPath}:{currentPath:number}) => {
    function getPreferenceStoreById(id: number, state: PreferenceStore) {
        switch (id) {
          case SERVICE_ID.VENUE:
            return state.venuePreference.description;
          case SERVICE_ID.PELAMIN:
            return state.pelaminPreference.description;
          case SERVICE_ID.CATERING:
            return state.cateringPreference.description;
          case SERVICE_ID.PHOTOGRAPHER:
            return state.photographerPreference.description;
          case SERVICE_ID.MUA:
            return state.muaPreference.description;
          case SERVICE_ID.CLOTHING:
            return state.clothingPreference.description;
          default:
            throw new Error(`Unknown service id: ${id}`);
        }
      }
    
      const prompt = usePreferenceStore((state) =>
        getPreferenceStoreById(currentPath, state),
      );
    
      const updateDetails = usePreferenceStore((state) => state.updatePreferenceDetails);

      return <div>
                <p>Describe your ideas</p>
                <CustomTextarea defaultValue={prompt} className="w-full" onChange={(e) => {updateDetails(currentPath, {description:e.target.value})}}/>
              </div>
}

export default PromptTextbox