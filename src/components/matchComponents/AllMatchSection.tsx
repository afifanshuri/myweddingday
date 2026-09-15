"use client";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useServiceStore } from "@/store/serviceStore";
import { retrieveVendorsByPreference } from "@/services/vendorService";
import { PackageType, ServiceType, VendorType } from "@/types/dataTypes";
import { useEffect, useState } from "react";

export default function AllMatchSection() {
  const [vendorsInActiveTab, setVendorsInActiveTab] = useState<VendorType[]>(
    [],
  );
  const [vendorsList, setVendorsList] = useState<VendorType[]>([]);
  const [servicesList, setServicesList] = useState<ServiceType[]>([]);
  const [activeServiceTab, setActiveServiceTab] = useState<number | null>(null);
  const selectedServiceIds = usePreferenceStore(
    (state) => state.weddingDetails.services,
  );
  const selectedLocations = usePreferenceStore(
    (state) => state.weddingDetails.locations,
  );

  const initServices = useServiceStore((state) => state.initServices);
  const servicesFromStore = useServiceStore((state) => state.service);

  useEffect(() => {
    const initData = async () => {
      if (!selectedServiceIds || selectedServiceIds.length === 0) {
        return;
      }

      await initServices();

      const preferencesList = usePreferenceStore
        .getState()
        .preferencesList.filter((p) => selectedServiceIds.includes(p.serviceId))
        .map((p) => ({
          serviceId: p.serviceId,
          budget: p.budget,
          criteria: p.criteria,
          location: selectedLocations,
        }));
      const result: { vendor: VendorType; packages: PackageType[] }[] =
        await retrieveVendorsByPreference(preferencesList);
      setVendorsList([...result.map((r) => r.vendor)]);
    };
    initData();
  }, []);

  useEffect(() => {
    const filtered = servicesFromStore.filter((s) =>
      selectedServiceIds.includes(s.id),
    );
    setServicesList(filtered);
  }, [servicesFromStore, selectedServiceIds]);

  useEffect(() => {
    if (activeServiceTab !== null) {
      setVendorsInActiveTab(
        vendorsList.filter((v) => v.serviceId == activeServiceTab),
      );
    }
  }, [activeServiceTab, vendorsList]);

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
                    className="border rounded-lg p-1 cursor-pointer"
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
