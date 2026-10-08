"use client";
import { useServiceStore } from "@/store/serviceStore";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ProgressBar } from "@/components/commonComponents/ProgressBar";
import AIBudgetInput from "@/components/weddingDetailComponents/BudgetSliderInput";
import ServiceTitleSection from "@/components/weddingDetailComponents/ServiceTitleSection";
import DirectionButtons from "@/components/weddingDetailComponents/DirectionButtons";
import PromptTextbox from "@/components/weddingDetailComponents/PromptTextbox";
import FieldRenderer from "@/components/commonComponents/FieldRenderer";
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
  const currentService = useServiceStore((state) =>
    state.service.find((service) => service.id === currentServiceId),
  );
  const requiredFields =
    preferencesList.find((p) => p.serviceId === currentServiceId)
      ?.requiredFields ?? [];
  const updateRequiredFields = usePreferenceStore(
    (state) => state.updateRequiredFields,
  );
  const criteria =
    preferencesList.find((p) => p.serviceId === currentServiceId)?.criteria ??
    {};

  const updatePreferenceDetails = usePreferenceStore(
    (state) => state.updatePreferenceDetails,
  );
  const user = useUserStore((state) => state.user);
  const fields = SERVICE_CRITERIA[currentServiceId] ?? [];
  const visibleFields = fields.filter((field) =>
    isCriteriaVisible(field, criteria, fields, user?.role),
  );
  const criteriaGroups = [
    {
      id: "basic",
      title: "Basic Criteria",
      fields: visibleFields.filter((field) => field.group === "basic"),
    },
    {
      id: "optional",
      title: "Optional Criteria",
      fields: visibleFields.filter((field) => field.group !== "basic"),
    },
  ];

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

      <AIBudgetInput
        key={currentServiceId}
        className="mb-10"
        service={
          currentService ?? { id: currentServiceId, serviceName: "Your Budget" }
        }
        budget={
          preferencesList.find(
            (preference) => preference.serviceId === currentServiceId,
          )?.budget ?? 0
        }
        onChange={(budget) =>
          updatePreferenceDetails(currentServiceId, { budget })
        }
      />

      <div className="flex flex-col gap-6">
        <p className="text-sm">
          Leave fields blank if you have no preference. Select a value, then
          tick “Must have” if every result must match it.
        </p>
        {criteriaGroups
          .filter((group) => group.fields.length > 0)
          .map((group) => (
            <section
              key={group.id}
              aria-labelledby={`${group.id}-criteria-heading`}
              className="rounded-lg border border-(--tertiary) bg-white p-4 sm:p-6 shadow-sm"
            >
              <h2
                id={`${group.id}-criteria-heading`}
                className="font-semibold mb-6"
              >
                {group.title}
              </h2>
              <div className="flex flex-col gap-6">
                {group.fields.map((field) => (
                  <FieldRenderer
                    key={field.key}
                    field={field}
                    value={criteria[field.key]}
                    required={requiredFields.includes(field.key)}
                    onRequiredChange={(key, checked) =>
                      updateRequiredFields(
                        currentServiceId,
                        checked
                          ? [...requiredFields, key]
                          : requiredFields.filter((item) => item !== key),
                      )
                    }
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
              </div>
            </section>
          ))}
        <DirectionButtons />
      </div>
    </div>
  );
}
