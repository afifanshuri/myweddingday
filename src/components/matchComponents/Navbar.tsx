"use client"
import { usePreferenceStore } from "@/app/store/preferenceStore";
import { useServiceStore } from "@/app/store/serviceStore";
import { useRouter } from "next/navigation";
import { VscDebugRestart, VscListFlat } from "react-icons/vsc"

export function Navbar(){
    const deleteAllServicesFromStore = useServiceStore(
    (state) => state.deleteAllService,
  );
  const deleteAllPreferenceData = usePreferenceStore(
    (state) => state.deleteAllPreferenceData,
  );
  
  const route = useRouter();

  const resetData = () => {
    deleteAllPreferenceData();
    deleteAllServicesFromStore();
    route.push("/");
  };

    return (
    <div className="flex h-50 items-center bg-(--positive) xl:flex-row flex-col justify-center xl:justify-between gap-2">
      <p className="xl:ml-10 libre-font text-[16px] xl:text-[30px] text-white">
        Specially curated vendors for 
      </p>
      <div className="flex gap-3 xl:self-end mr-6 mb-4 text-[10px] xl:text-[16px] text-(--positive-tertiary)">
        <div className="flex flex-row gap-2 bg-(--positive-secondary) p-2 rounded-2xl items-center opacity-70 hover:opacity-100 hover:cursor-pointer">
          <VscListFlat />
          <p>Edit Preferences</p>
        </div>

        <div
          className="flex flex-row gap-2 bg-(--positive-secondary) p-2 rounded-2xl items-center hover:cursor-pointer opacity-70 hover:opacity-100"
          onClick={() => resetData()}
        >
          <VscDebugRestart />
          <p>Start Over</p>
        </div>
      </div>
    </div>)
}