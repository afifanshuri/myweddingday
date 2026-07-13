"use client";
import { usePreferenceStore } from "@/app/store/preferenceStore";
import { useServiceStore } from "@/app/store/serviceStore";
import { ServiceType } from "@/types/basicTypes";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const ServiceSelector = ({
  servicesList,
}: {
  servicesList: ServiceType[];
}) => {
  const router = useRouter();
  const allServices = useServiceStore((state) => state.selectedService);
  const addAllServicesToStore = useServiceStore(
    (state) => state.addAllSelectedService,
  );
  const deleteAllServicesFromStore = useServiceStore(
    (state) => state.deleteAllService,
  );
  const deleteAllPreferenceData = usePreferenceStore(
    (state) => state.deleteAllPreferenceData,
  );

  const [selectedServices, setSelectedServices] =
    useState<number[]>(allServices);

  const toggleClickService = (id: number) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter((s) => s != id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const onSubmitChoice = () => {
    console.log(selectedServices);
    addAllServicesToStore(selectedServices);
    router.push(`/weddingplan/${selectedServices[0]}`);
  };

  const onGoBack = () => {
    deleteAllServicesFromStore();
    deleteAllPreferenceData();
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-10 ">
      <div id="wedDetails"></div>
      <p>Choose Your Services</p>
      <div id="serviceDetails" className="grid grid-cols-2 gap-2">
        {servicesList.map((s, index) => {
          return (
            <div
              key={index}
              className={`border p-10 rounded-lg hover:bg-gray-400 hover:cursor-pointer transition ${selectedServices.includes(s.id) ? "bg-gray-400" : "bg-auto"} text-center `}
              onClick={() => toggleClickService(s.id)}
            >
              <p>{s.serviceName}</p>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => onGoBack()}
          className="flex border p-2 rounded-2xl hover:cursor-pointer"
        >
          Back
        </button>
        <button
          onClick={onSubmitChoice}
          className="flex border p-2 rounded-2xl hover:cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
