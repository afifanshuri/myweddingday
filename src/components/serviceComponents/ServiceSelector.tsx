"use client";
import { usePreferenceStore } from "@/app/store/preferenceStore";
import { useServiceStore } from "@/app/store/serviceStore";
import { ServiceType } from "@/types/dataTypes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MainButton from "../commonComponents/MainButton";
import { BsCheck } from "react-icons/bs";
import { SERVICE_ID } from "@/constants/commonConstants";
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
  const existingServicesFromStore = usePreferenceStore(
    (state) => state.weddingDetails.services,
  );
  const updateWeddingDetails = usePreferenceStore(
    (state) => state.updateWeddingDetails,
  );

  const toggleClickService = (id: number) => {
    const newServices = existingServicesFromStore.includes(id)
      ? existingServicesFromStore.filter((s) => s !== id)
      : [...existingServicesFromStore, id];
    updateWeddingDetails({ services: newServices });
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
    <div className="flex flex-col gap-4">
      <div id="wedDetails"></div>
      <p className="libre-font xl:text-[20px]">2. Choose Your Services</p>
      <div id="serviceDetails" className="grid grid-cols-2 gap-2">
        {servicesList.map((s, index) => {
          return (
            <div
              key={index}
              className={`flex flex-col border-2 p-4 xl:p-6 gap-2 rounded-lg  hover:cursor-pointer transition ${existingServicesFromStore.includes(s.id) ? "bg-(--positive) border-(--positive-secondary)" : "bg-auto border-(--secondary) bg-white hover:bg-(--secondary) hover:border-(--tertiary)"}`}
              onClick={() => {
                toggleClickService(s.id);
                onFieldChange();
              }}
            >
              <div
                className={`brightness-70 flex flex-row text-[24px] xl:text-[30px] ${existingServicesFromStore.includes(s.id) ? "text-(--positive-secondary)" : "text-(--tertiary)"}`}
              >
                <div className="flex-2 flex-wrap">
                  {retrieveServiceIcon(s.id)}
                </div>
                <BsCheck
                  className={`justify-end ${existingServicesFromStore.includes(s.id) ? "" : "hidden"}`}
                />
              </div>

              <div>
                <p className="">{s.serviceName}</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className={`${errors?.services ? "flex" : "hidden"} text-red-600`}>
        {errors?.services
          ? errors.services
          : "Please select at least one service"}
      </p>
    </div>
  );
};
