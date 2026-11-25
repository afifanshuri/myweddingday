"use client";
import { WEDDING_PLAN } from "@/config/weddingPlan";
import { usePreferenceStore } from "@/store/preferenceStore";
import CustomInput from "@/components/commonComponents/CustomInput";
import MainButton from "@/components/commonComponents/MainButton";
import { ServiceSelector } from "@/components/weddingDetailComponents/ServiceSelector";
import { validateWeddingDetails } from "@/services/others/fieldValidationService";
import {
  LocationType,
  ServiceType,
  WeddingDetailType,
} from "@/types/dataTypes";
import { WeddingFormErrors } from "@/types/errorTypes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useServiceStore } from "@/store/serviceStore";
import SearchModeSelector, { type SearchMode } from "./SearchModeSelector";
import AISearchPanel from "./AISearchPanel";
import { ROUTES, serviceCriteriaRoute } from "@/config/routes";
import { useT } from "@/i18n";

export default function WeddingDetailsPage({
  latestLocations,
  latestServices,
}: {
  latestLocations: LocationType[];
  latestServices: ServiceType[];
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<WeddingFormErrors>({});
  const [searchMode, setSearchMode] = useState<SearchMode>("manual");
  const t = useT();

  const addAllServices = useServiceStore((state) => state.addAllService);
  const syncServiceNames = usePreferenceStore((state) => state.syncServiceNames);
  useEffect(() => {
    addAllServices(latestServices);
    syncServiceNames(latestServices);
  }, [addAllServices, latestServices, syncServiceNames]);
  const weddingDetailsFromStore = usePreferenceStore(
    (state) => state.weddingDetails,
  );

  const updateWeddingDetails = usePreferenceStore(
    (state) => state.updateWeddingDetails,
  );

  const validateFields = (details: WeddingDetailType) => {
    const nextErrors: WeddingFormErrors = validateWeddingDetails(details, t.planner.errors);
    setErrors(nextErrors);
    return nextErrors;
  };

  const toggleSelectLocation = (id: number) => {
    const newLocationlist = weddingDetailsFromStore.locations.includes(id)
      ? weddingDetailsFromStore.locations.filter((l) => l != id)
      : [...weddingDetailsFromStore.locations, id];
    updateWeddingDetails({ locations: newLocationlist });
  };

  function onSubmit() {
    const nextErrors = validateFields({ ...weddingDetailsFromStore });
    if (Object.keys(nextErrors).length === 0) {
      router.push(serviceCriteriaRoute(weddingDetailsFromStore.services[0]));
    }
  }

  function onGoBack() {
    router.push(ROUTES.home);
  }

  return (
    <div className="mb-10 space-y-14">
      <SearchModeSelector value={searchMode} onChange={setSearchMode} />

      <p className="opacity-50 font-light mb-4">{t.planner.start}</p>
      <div className="rounded-2xl border border-(--tertiary) bg-white p-5 sm:p-8">
        <p className="mb-4 libre-font xl:text-[20px]">
          {t.planner.detailsHeading}
        </p>
        <div className="flex flex-col gap-8">
          <div className="w-full">
            <label htmlFor="wedding-couple">{t.planner.coupleNames}</label>
            <CustomInput
              id="wedding-couple"
              value={weddingDetailsFromStore.coupleName}
              type="text"
              maxLength={WEDDING_PLAN.coupleNameMax}
              placeholder={t.planner.couplePlaceholder}
              className="w-full"
              onChange={(e) => {
                updateWeddingDetails({ coupleName: e.target.value });
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.coupleName;
                  return next;
                });
              }}
            ></CustomInput>
            <p
              className={`${errors?.coupleName ? "flex" : "hidden"} text-red-600`}
            >
              {errors.coupleName ? errors.coupleName : null}
            </p>
          </div>
          <div className="flex flex-row gap-4">
            <div className="w-full">
              <label htmlFor="wedding-date">{t.planner.weddingDate}</label>
              <CustomInput
                id="wedding-date"
                value={weddingDetailsFromStore.date ?? ""}
                type="date"
                className="w-full"
                onChange={(e) => {
                  updateWeddingDetails({ date: e.target.value || null });
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.date;
                    return next;
                  });
                }}
              ></CustomInput>
              <p className={`${errors?.date ? "flex" : "hidden"} text-red-600`}>
                {errors.date ? errors.date : null}
              </p>
            </div>
            <div className="w-full">
              <label htmlFor="wedding-guests">{t.planner.guests}</label>
              <CustomInput
                id="wedding-guests"
                value={weddingDetailsFromStore.pax ?? 0}
                type="number"
                className="w-full"
                onChange={(e) => {
                  updateWeddingDetails({ pax: Number(e.target.value) });
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.pax;
                    return next;
                  });
                }}
              ></CustomInput>
              <p className={`${errors?.pax ? "flex" : "hidden"} text-red-600`}>
                {errors.pax ? errors.pax : null}
              </p>
            </div>
          </div>

          <div>
            <p>{t.planner.locations}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {latestLocations.map((l) => {
                return (
                  <MainButton
                    variant="choice"
                    size="small"
                    type="button"
                    aria-pressed={weddingDetailsFromStore.locations.includes(
                      l.id,
                    )}
                    key={l.id}
                    onClick={() => {
                      toggleSelectLocation(l.id);
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.locations;
                        return next;
                      });
                    }}
                  >
                    {l.locationName}
                  </MainButton>
                );
              })}
            </div>
            <p
              className={`${errors?.locations ? "flex" : "hidden"} text-red-600`}
            >
              {errors.locations ? errors.locations : null}
            </p>
          </div>
        </div>
      </div>
      <ServiceSelector
        servicesList={latestServices}
        errors={errors}
        onFieldChange={() => {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.services;
            return next;
          });
        }}
      />

      <div hidden={searchMode !== "ai"}>
        <AISearchPanel
          locations={latestLocations}
          services={latestServices}
          validateDetails={() =>
            Object.keys(validateFields({ ...weddingDetailsFromStore }))
              .length === 0
          }
        />
      </div>
      <div className="flex justify-end gap-2">
        <MainButton variant="secondary" onClick={() => onGoBack()}>
          {t.common.back}
        </MainButton>
        {searchMode === "manual" && (
          <MainButton onClick={onSubmit}>
            {t.planner.continueManual}
          </MainButton>
        )}
      </div>
    </div>
  );
}
