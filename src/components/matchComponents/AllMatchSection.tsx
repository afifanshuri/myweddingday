"use client";
import { usePreferenceStore } from "@/app/store/preferenceStore";
import { useServiceStore } from "@/app/store/serviceStore";
import { retrieveServicesListByIds } from "@/services/serviceService";
import { retrieveVendorsByPreference } from "@/services/vendorService";
import { PackageType, ServiceType, VendorType } from "@/types/dataTypes";
import { useEffect, useState } from "react";

export default function AllMatchSection() {
  const [vendorsInActiveTab, setVendorsInActiveTab] = useState<VendorType[]>(
    [],
  );
  const [vendorsList, setVendorsList] = useState<VendorType[]>([]);
  const [servicesList, setservicesList] = useState<ServiceType[]>([]);
  const [activeServiceTab, setActiveServiceTab] = useState<number | null>(null);
  const selectedServiceIds = useServiceStore((state) => state.selectedService);
  const selectedLocations = usePreferenceStore(
    (state) => state.weddingDetails.locations,
  );

  useEffect(() => {
    const initData = async () => {
      if (!selectedServiceIds) {
        return;
      }
      const servicesListFromDB =
        await retrieveServicesListByIds(selectedServiceIds);
      setservicesList(servicesListFromDB);

      const preferencesList = usePreferenceStore
        .getState()
        .preferencesList.filter((p) => selectedServiceIds.includes(p.serviceId))
        .map((p) => ({
          serviceId: p.serviceId,
          budget: p.budget,
          embedding: p.embedding,
          location: selectedLocations,
        }));
      const result: { vendor: VendorType; packages: PackageType[] }[] =
        await retrieveVendorsByPreference(preferencesList);
      console.log("Vendors retrieved from API:", result);
      setVendorsList([...result.map((r) => r.vendor)]);
    };
    initData();
  }, []);

  useEffect(() => {
    const fetchVendors = async () => {
      if (activeServiceTab !== null) {
        setVendorsInActiveTab(
          vendorsList.filter((v) => v.serviceId == activeServiceTab),
        );
      }
    };
    fetchVendors();
  }, [activeServiceTab]);

  return (
    <div className="bg-white rounded-lg p-4 border border-(--secondary)">
      <p className="libre-font">All Matches</p>
      <p className="text-[14px] font-extralight opacity-50">
        {vendorsList.length} Vendors found
      </p>
      <div>
        {servicesList.length === 0 ? (
          <div>Loading...</div>
        ) : (
          <div>
            <div id="servicesListNavContainer" className="flex flex-row gap-2">
              {servicesList.map((service: ServiceType, index: number) => {
                return (
                  <div
                    key={index}
                    className="border rounded-lg p-1"
                    onClick={() => {
                      setActiveServiceTab(service.id);
                    }}
                  >
                    {service.serviceName}
                  </div>
                );
              })}
            </div>
            <div id="vendorsContainer" className="grid grid-cols-4 gap-2">
              {vendorsInActiveTab.map((vendor, index) => {
                return <div key={index}>{vendor.vendorName}</div>;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
