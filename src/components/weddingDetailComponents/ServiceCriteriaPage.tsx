"use client";
import { useServiceStore } from "@/store/serviceStore";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useEffect, useState } from "react";
import { VscDebugRestart } from "react-icons/vsc";
import MainButton from "@/components/commonComponents/MainButton";
import { ProgressBar } from "@/components/commonComponents/ProgressBar";
import AIBudgetInput from "@/components/weddingDetailComponents/BudgetSliderInput";
import ServiceTitleSection from "@/components/weddingDetailComponents/ServiceTitleSection";
import DirectionButtons from "@/components/weddingDetailComponents/DirectionButtons";
import FieldRenderer from "@/components/commonComponents/FieldRenderer";
import { useSelectedServices } from "@/hooks/useSelectedServices";
import {
  clearHiddenCriteria,
  isCriteriaVisible,
  SERVICE_CRITERIA,
} from "@/config/serviceCriteria";

// The service comes from the server page as a prop, not useParams(): Next.js keeps visited pages mounted
// (hidden) after navigating away, and useParams() would then return the new URL's params (no serviceId).
export default function ServicePage({ serviceId: currentServiceId }: { serviceId: number }) {
  const changeCurrentActivePage = useServiceStore(
    (state) => state.changeCurrentActiveServicePage,
  );

  const preferencesList = usePreferenceStore((state) => state.preferencesList);
  const services = useSelectedServices();
  const currentService = services.find((service) => service.id === currentServiceId)
    ?? { id: currentServiceId, serviceName: `Service ${currentServiceId}` };
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
  const fields = SERVICE_CRITERIA[currentServiceId] ?? [];
  const visibleFields = fields.filter((field) =>
    isCriteriaVisible(field, criteria, fields, "user"),
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
  const [confirmingReset, setConfirmingReset] = useState(false);
  // Remounts the budget input after a reset, so its slider range starts afresh too.
  const [resets, setResets] = useState(0);

  return (
    <div>
      <ProgressBar className="mb-10" currentPath={currentServiceId} />
      <div className="flex flex-row gap-4">
        <ServiceTitleSection
          className="mb-10 libre-font"
          currentServiceId={currentServiceId}
          serviceName={currentService.serviceName}
        />
      </div>

      <AIBudgetInput
        key={`${currentServiceId}:${resets}`}
        className="mb-10"
        service={currentService}
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
        {/* Clears this service's budget, criteria and must-haves only, after a confirmation. */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-(--tertiary) pt-6 text-sm">
          {confirmingReset ? <>
            <p role="alert" className="mr-auto">Clear all {currentService.serviceName} preferences? Your budget, criteria and must-haves for this service will be removed.</p>
            <MainButton variant="secondary" size="small" onClick={() => setConfirmingReset(false)}>Cancel</MainButton>
            <MainButton variant="danger" size="small" onClick={() => {
              updatePreferenceDetails(currentServiceId, { budget: 0, description: "", criteria: {}, requiredFields: [] });
              setConfirmingReset(false);
              setResets((count) => count + 1);
            }}>Clear {currentService.serviceName}</MainButton>
          </> : <MainButton variant="ghost" size="small" onClick={() => setConfirmingReset(true)}>
            <VscDebugRestart aria-hidden="true" />
            Reset this service
          </MainButton>}
        </div>
        <DirectionButtons />
      </div>
    </div>
  );
}
