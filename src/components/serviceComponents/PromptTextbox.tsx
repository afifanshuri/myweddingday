"use client"
import { PreferenceStore, usePreferenceStore } from "@/app/store/preferenceStore";
import { SERVICE_ID } from "@/constants/commonConstants";
import CustomTextarea from "../commonComponents/CustomTextarea";

const PromptTextbox = ({currentPath}:{currentPath:number}) => {
      const prompt = usePreferenceStore((state) =>
        state.preferencesList.find((preference) => preference.serviceId === currentPath)?.description
      );
    
      const updateDetails = usePreferenceStore((state) => state.updatePreferenceDetails);

      return <div>
                <p>Describe your ideas</p>
                <CustomTextarea defaultValue={prompt} className="w-full" onChange={(e) => {updateDetails(currentPath, {description:e.target.value})}}/>
              </div>
}

export default PromptTextbox