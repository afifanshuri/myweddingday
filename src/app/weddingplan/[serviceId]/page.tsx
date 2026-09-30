"use client";
import { useServiceStore } from "@/store/serviceStore";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ProgressBar } from "@/components/commonComponents/ProgressBar";
import { BudgetSlider } from "@/components/serviceComponents/BudgetSlider";
import ServiceTitleSection from "@/components/serviceComponents/ServiceTitleSection";
import DirectionButtons from "@/components/serviceComponents/DirectionButtons";
import PromptTextbox from "@/components/serviceComponents/PromptTextbox";
import FieldRenderer from "@/components/serviceComponents/FieldRenderer";
import {
  clearHiddenCriteria,
  isCriteriaVisible,
  SERVICE_CRITERIA,
} from "@/config/serviceCriteria";
import { useUserStore } from "@/store/userStore";

export default function ServicePage() {
  const params = useParams();
  const currentServiceId = Number(params.serviceId);
  const changeCurrentActivePage = useServiceStore(
    (state) => state.changeCurrentActiveServicePage,
  );

  const preferencesList = usePreferenceStore((state) => state.preferencesList);
  const criteria =
    preferencesList.find((p) => p.serviceId === currentServiceId)?.criteria ??
    {};

  const updatePreferenceDetails = usePreferenceStore(
    (state) => state.updatePreferenceDetails,
  );
  const user = useUserStore((state) => state.user);
  const fields = SERVICE_CRITERIA[currentServiceId] ?? [];

  useEffect(() => {
    changeCurrentActivePage(currentServiceId);
  }, [currentServiceId, changeCurrentActivePage]);

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

      <div className="flex flex-col gap-6">
        {fields
          .filter((field) =>
            isCriteriaVisible(field, criteria, fields, user?.role),
          )
          .map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={criteria[field.key]}
              onChange={(key, value) =>
                updatePreferenceDetails(currentServiceId, {
                  criteria: clearHiddenCriteria(fields, {
                    ...criteria,
                    [key]: value,
                  }),
                })
              }
            />
          ))}
        <PromptTextbox currentPath={currentServiceId} />
        <DirectionButtons />
      </div>
    </div>
  );
}
