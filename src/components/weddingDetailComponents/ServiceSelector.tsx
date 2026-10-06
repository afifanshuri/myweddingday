"use client";
import MainButton from "@/components/commonComponents/MainButton";

import { usePreferenceStore } from "@/store/preferenceStore";
import { ServiceType } from "@/types/dataTypes";
import { BsCheck } from "react-icons/bs";
import { SERVICE_ID } from "@/config/serviceCriteria";
import { useId } from "react";
import {
  GiAmpleDress,
  GiFamilyHouse,
  GiForkKnifeSpoon,
  GiLipstick,
  GiPhotoCamera,
  GiSofa,
} from "react-icons/gi";

export const ServiceSelector = ({
  servicesList,
  errors,
  onFieldChange,
}: {
  servicesList: ServiceType[];
  errors?: {
    services?: string;
  };
  onFieldChange: () => void;
}) => {
  const descriptionId = useId();
  const errorId = useId();
  const existingServicesFromStore = usePreferenceStore(
    (state) => state.weddingDetails.services,
  );
  const updateWeddingDetails = usePreferenceStore(
    (state) => state.updateWeddingDetails,
  );

  const toggleClickService = (id: number) => {
    updateWeddingDetails({
      services: existingServicesFromStore.includes(id)
        ? existingServicesFromStore.filter((s) => s !== id)
        : [...existingServicesFromStore, id],
    });
  };

  const retrieveServiceIcon = (id: number) => {
    switch (id) {
      case SERVICE_ID.VENUE:
        return <GiFamilyHouse />;
      case SERVICE_ID.PELAMIN:
        return <GiSofa />;
      case SERVICE_ID.CATERING:
        return <GiForkKnifeSpoon />;
      case SERVICE_ID.PHOTOGRAPHER:
        return <GiPhotoCamera />;
      case SERVICE_ID.MUA:
        return <GiLipstick />;
      case SERVICE_ID.CLOTHING:
        return <GiAmpleDress />;
      default:
        throw new Error(`Unknown service id: ${id}`);
    }
  };

  return (
    <fieldset
      id="wedDetails"
      aria-describedby={`${descriptionId}${errors?.services ? ` ${errorId}` : ""}`}
      className="min-w-0"
    >
      <legend className="libre-font text-xl">2. Choose Your Services</legend>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p
          id={descriptionId}
          className="text-sm font-normal text-foreground/60"
        >
          Select everything you need for your day. You can choose more than one.
        </p>
        <span className="rounded-full bg-(--secondary) px-3 py-1 text-xs text-(--positive-tertiary)">
          {
            servicesList.filter((service) =>
              existingServicesFromStore.includes(service.id),
            ).length
          }{" "}
          selected
        </span>
      </div>
      <div
        id="serviceDetails"
        className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {servicesList.map((s) => {
          const isSelected = existingServicesFromStore.includes(s.id);

          return (
            <MainButton variant="custom" size="none"
              type="button"
              aria-pressed={isSelected}
              aria-label={s.serviceName}
              key={s.id}
              className={`group flex h-full cursor-pointer flex-col items-start justify-start gap-4 rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--positive-tertiary) motion-reduce:transition-none sm:p-5 ${isSelected ? "border-(--positive-secondary) bg-(--positive)/20 ring-1 ring-(--positive-secondary)" : "border-(--tertiary) bg-white hover:border-(--positive-secondary) hover:bg-(--secondary)/50 hover:shadow-sm"}`}
              onClick={() => {
                toggleClickService(s.id);
                onFieldChange();
              }}
            >
              <span
                className="flex w-full items-start justify-between gap-2"
                aria-hidden="true"
              >
                <span
                  className={`flex size-12 items-center justify-center rounded-xl text-2xl text-(--positive-tertiary) transition-colors motion-reduce:transition-none ${isSelected ? "bg-(--positive)/60" : "bg-(--secondary) group-hover:bg-(--tertiary)"}`}
                >
                  {retrieveServiceIcon(s.id)}
                </span>
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-(--positive-tertiary) bg-(--positive-tertiary) text-white" : "border-(--fourth) bg-white"}`}
                >
                  {isSelected && <BsCheck className="size-5" />}
                </span>
              </span>
              <span className="flex flex-col gap-1.5">
                <span className="text-base font-semibold text-(--positive-tertiary)">
                  {s.serviceName}
                </span>
              </span>
            </MainButton>
          );
        })}
      </div>
      {errors?.services && (
        <p
          id={errorId}
          role="alert"
          className="mt-3 text-sm font-normal text-red-600"
        >
          {errors.services}
        </p>
      )}
    </fieldset>
  );
};
