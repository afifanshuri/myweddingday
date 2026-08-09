"use client";
import { usePreferenceStore } from "@/app/store/preferenceStore";
import CustomInput from "@/components/commonComponents/CustomInput";
import MainButton from "@/components/commonComponents/MainButton";
import { ServiceSelector } from "@/components/serviceComponents/ServiceSelector";
import WeddingDetailsPageButtons from "@/components/serviceComponents/WeddingDetailsPageButtons";
import { validateWeddingDetails } from "@/services/fieldValidationService";
import {
  LocationType,
  ServiceType,
  WeddingDetailType,
} from "@/types/dataTypes";
import { WeddingFormErrors } from "@/types/errorTypes";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WeddingDetailsPage({
  locations,
  services,
}: {
  locations: LocationType[];
  services: ServiceType[];
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<WeddingFormErrors>({});

  const weddingDetailsFromStore = usePreferenceStore(
    (state) => state.weddingDetails,
  );

  const updateWeddingDetails = usePreferenceStore(
    (state) => state.updateWeddingDetails,
  );

  const validateFields = (details: WeddingDetailType) => {
    const nextErrors: WeddingFormErrors = validateWeddingDetails(details);
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
      router.push(`/weddingplan/${weddingDetailsFromStore.services[0]}`);
    }
  }

  function onGoBack() {
    router.push("/");
  }

  return (
    <div className="mb-10">
      <p className="opacity-50 font-light mb-4">Let&apos;s get started!</p>
      <p className="mb-4 libre-font xl:text-[20px]">
        1. Tell Us About Your Wedding
      </p>
      <div className="flex flex-col gap-8">
        <div className="w-full">
          <p>Couple&apos;s Names</p>
          <CustomInput
            value={weddingDetailsFromStore.coupleName}
            type="text"
            placeholder="e.g. Amira & Syafiq"
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
            <p>Wedding Date</p>
            <CustomInput
              value={
                weddingDetailsFromStore.date
                  ? weddingDetailsFromStore.date.toISOString().split("T")[0]
                  : ""
              }
              type="date"
              placeholder="e.g. Amira & Syafiq"
              className="w-full"
              onChange={(e) => {
                updateWeddingDetails({ date: new Date(e.target.value) });
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
            <p>Estimated Guests</p>
            <CustomInput
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
          <p>Vendor Locations</p>
          <div className="flex flex-row gap-2 text-[10px]">
            {locations.map((l) => {
              return (
                <div
                  key={l.id}
                  className={`${weddingDetailsFromStore.locations.includes(l.id) ? "bg-(--positive) border-(--positive)" : "bg-white border-(--tertiary)"} cursor-pointer hover:bg-(--positive) p-2 border rounded-lg`}
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
                </div>
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
      <ServiceSelector
        servicesList={services}
        errors={errors}
        onFieldChange={() => {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.services;
            return next;
          });
        }}
      />

      <div className="flex justify-end gap-2">
        <MainButton onClick={() => onGoBack()}>Back</MainButton>
        <MainButton onClick={onSubmit}>Continue</MainButton>
      </div>
    </div>
  );
}
