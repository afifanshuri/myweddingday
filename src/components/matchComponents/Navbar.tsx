"use client";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useServiceStore } from "@/store/serviceStore";
import { useRouter } from "next/navigation";
import { VscDebugRestart, VscListFlat } from "react-icons/vsc";
import MainButton from "@/components/commonComponents/MainButton";

export function Navbar() {
  const coupleName = usePreferenceStore(
    (state) => state.weddingDetails.coupleName,
  );

  const deleteAllPreferenceData = usePreferenceStore(
    (state) => state.deleteAllPreferenceData,
  );

  const route = useRouter();

  const resetData = () => {
    deleteAllPreferenceData();
    route.push("/");
  };

  return (
    <div className="flex h-50 items-center bg-(--positive) xl:flex-row flex-col justify-center xl:justify-between gap-2">
      <p className="xl:ml-10 libre-font text-[16px] xl:text-[30px] text-white">
        Specially curated vendors for {coupleName || "your wedding"}
      </p>
      <div className="flex gap-3 xl:self-end mr-6 mb-4 text-[10px] xl:text-[16px] text-(--positive-tertiary)">
        <MainButton variant="secondary" size="small" disabled>
          <VscListFlat />
          <p>Edit Preferences</p>
        </MainButton>

        <MainButton
          variant="secondary"
          size="small"
          onClick={() => resetData()}
        >
          <VscDebugRestart />
          <p>Start Over</p>
        </MainButton>
      </div>
    </div>
  );
}
