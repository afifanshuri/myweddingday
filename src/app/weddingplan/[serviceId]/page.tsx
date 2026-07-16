"use client";
import { useServiceStore } from "@/app/store/serviceStore";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ProgressBar } from "@/components/commonComponents/ProgressBar";
import { BudgetSlider } from "@/components/serviceComponents/BudgetSlider";
import ServiceTitleSection from "@/components/serviceComponents/ServiceTitleSection";
import DirectionButtons from "@/components/serviceComponents/DirectionButtons";
import StylesSelector from "@/components/serviceComponents/StylesSelector";
import CustomTextarea from "@/components/commonComponents/CustomTextarea";

export default function ServicePage() {
  const params = useParams();
  const currentServiceId = Number(params.serviceId);
  const changeCurrentActivePage = useServiceStore(
    (state) => state.changeCurrentActiveServicePage,
  );

  useEffect(() => {
    changeCurrentActivePage(currentServiceId);
  }, []);

  return (
    <div>
      <ProgressBar className="mb-10" currentPath={currentServiceId} />
      <div className="flex flex-row gap-4">
        <ServiceTitleSection
          className="mb-10 libre-font"
          currentServiceId={currentServiceId}
        />
      </div>

      <BudgetSlider
        className="mb-10"
        currentPath={currentServiceId}
      ></BudgetSlider>
      <div className="flex flex-col gap-10">
        <div>
          <p>Styles</p>
          <StylesSelector currentPath={currentServiceId} />
        </div>

        <div>
          <p>Describe your ideas</p>
          <CustomTextarea className="w-full" />
        </div>
        <DirectionButtons />
      </div>
    </div>
  );
}
