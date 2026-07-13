"use client";
import { VenuePage } from "@/subpages/servicePreference/VenuePage";
import { PhotographerPage } from "@/subpages/servicePreference/PhotographerPage";
import { useServiceStore } from "@/app/store/serviceStore";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { CateringPage } from "@/subpages/servicePreference/CateringPage";
import { ProgressBar } from "@/components/commonComponents/ProgressBar";
import { BudgetSlider } from "@/components/serviceComponents/BudgetSlider";
import TitleSection from "@/components/serviceComponents/TitleSection";
import DirectionButtons from "@/components/serviceComponents/DirectionButtons";
import { SERVICE_ID } from "@/constants/commonConstants";
import StylesSelector from "@/components/serviceComponents/StylesSelector";
import { PelaminPage } from "@/subpages/servicePreference/PelaminPage";
import { MUAPage } from "@/subpages/servicePreference/MUAPage";
import { ClothingPage } from "@/subpages/servicePreference/ClothingPage";

export default function ServicePage() {
  const params = useParams();
  const currentServiceId = Number(params.serviceId);
  const changeCurrentActivePage = useServiceStore(
    (state) => state.changeCurrentActiveServicePage,
  );

  const onPopulateServicePage = (id: number) => {
    switch (id) {
      case SERVICE_ID.VENUE:
        return <VenuePage />;
      case SERVICE_ID.PELAMIN:
        return <PelaminPage />;
      case SERVICE_ID.CATERING:
        return <CateringPage />;
      case SERVICE_ID.PHOTOGRAPHER:
        return <PhotographerPage />;
      case SERVICE_ID.MUA:
        return <MUAPage />;
      case SERVICE_ID.CLOTHING:
        return <ClothingPage />;
    }
  };

  const onPopulateServiceTitlePage = (id: number) => {
    switch (id) {
      case SERVICE_ID.VENUE:
        return "Venue";
      case SERVICE_ID.PELAMIN:
        return "Pelamin";
      case SERVICE_ID.CATERING:
        return "Caterings";
      case SERVICE_ID.PHOTOGRAPHER:
        return "Photographers";
      case SERVICE_ID.MUA:
        return "Makeup Artists";
      case SERVICE_ID.CLOTHING:
        return "Clothings";
      default:
        return "Title";
    }
  };

  useEffect(() => {
    changeCurrentActivePage(currentServiceId);
  }, []);

  return (
    <div>
      <ProgressBar className="mb-10" currentPath={currentServiceId} />
      <TitleSection
        className="mb-10"
        label={onPopulateServiceTitlePage(currentServiceId)}
      />
      <BudgetSlider
        className="mb-10"
        currentPath={currentServiceId}
      ></BudgetSlider>
      <div>
        <p>Styles</p>
        <StylesSelector currentPath={currentServiceId} />
      </div>
      <div>{onPopulateServicePage(currentServiceId)}</div>
      <DirectionButtons />
    </div>
  );
}
