"use client";
import { usePreferenceStore } from "@/app/store/preferenceStore";
import { useServiceStore } from "@/app/store/serviceStore";
import { retrieveVendorsByPreference } from "@/services/vendorService";
import { ServiceType, VendorType } from "@/types/dataTypes";
import { useEffect, useState } from "react";

export default function AllMatchSection() {
  const [vendors, setVendors] = useState<VendorType[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [currentServiceId, setCurrentServiceId] = useState<number | null>(null);
  const [currentVendors, setCurrentVendors] = useState<VendorType[]>([]);
  const selectedServices = useServiceStore((state) => state.selectedService);
  const selectedLocations = usePreferenceStore((state) => state.weddingDetails.locations);

  useEffect(() => {
    const initData = async () => {
      
      if (!selectedServices) {
        return;
      }

      console.log("Selected Services:", selectedServices);
      const preferencesList = usePreferenceStore.getState().preferencesList.filter((p) => selectedServices.includes(p.serviceId)).map((p) => ({ serviceId: p.serviceId, budget: p.budget, embedding: p.embedding, location: selectedLocations }));
      console.log("Preferences List1:", preferencesList);
      const result = await retrieveVendorsByPreference(preferencesList);
      console.log("Retrieved vendors:", result);
    };
    initData();
  }, []);

  useEffect(() => {
    console.log("in change service");
    const fetchVendors = async () => {
      if (currentServiceId !== null) {
        setCurrentVendors(
          vendors.filter((v) => v.serviceId == currentServiceId),
        );
      }
    };

    fetchVendors();
  }, [currentServiceId]);
  return (
    <div className="bg-white rounded-lg p-4 border border-(--secondary)">
      <p className="libre-font">All Matches</p>
      <p className="text-[14px] font-extralight opacity-50">
        1000 Vendors found
      </p>
      <div>
        {services.length === 0 ? (
          <div>Loading...</div>
        ) : (
          <div className="p-4">
            Vendor Section
            <div id="servicesNavContainer" className="flex flex-row gap-2">
              {services.map((service: ServiceType, index: number) => {
                return (
                  <div
                    key={index}
                    className="border rounded-lg p-1"
                    onClick={() => {
                      setCurrentServiceId(service.id);
                    }}
                  >
                    {service.serviceName}
                  </div>
                );
              })}
            </div>
            <div id="vendorsContainer" className="grid grid-cols-4 gap-2">
              {currentVendors.map((vendor, index) => {
                return <div key={index}>{vendor.vendorName}</div>;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
