"use client";
import PackageDetailSection from "@/components/adminComponents/PackageDetailsSection";
import CustomInput from "@/components/commonComponents/CustomInput";
import CustomTextarea from "@/components/commonComponents/CustomTextarea";
import { LocationType, ServiceType } from "@/types/basicTypes";
import { useEffect, useState } from "react";
import { useAdminStore } from "../store/adminStore";
import MainButton from "@/components/commonComponents/MainButton";
import { FaStar } from "react-icons/fa";

export default function AdminPage() {
  const [servicesList, setServicesList] = useState<ServiceType[]>([]);
  const [locationList, setLocationList] = useState<LocationType[]>([]);
  const [rating, setRating] = useState(0);

  const vendorFromStore = useAdminStore((state) => state.vendor);
  const addPackageToStore = useAdminStore((state) => state.addPackage);
  const packageListFromStore = useAdminStore((state) => state.packageList);
  const updateVendorDataToStore = useAdminStore((state) => state.updateVendor);

  useEffect(() => {
    async function populateData() {
      const locationsList = await fetch("/api/locations").then((res) =>
        res.json(),
      );
      setLocationList(locationsList);
      const servicesList = await fetch("/api/services").then((res) =>
        res.json(),
      );
      setServicesList(servicesList);
    }
    populateData();
  }, []);

  function addNewPackage() {
    addPackageToStore();
  }

  async function saveVendor() {
    try {
      console.info("In Save Vendor Method (page.tsx)");
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vendorFromStore),
      });

      if (response.ok) {
        console.log("In The After Response From Vendor API (page.tsx)");
        const data = await response.json();
        updateVendorDataToStore({ id: data.id });
        savePackages(data.id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function savePackages(id: number) {
    const formData = new FormData();
    formData.append("vendor", JSON.stringify({ ...vendorFromStore, id: id }));
    packageListFromStore.forEach((pkg, index) => {
      formData.append(`package_${index}`, JSON.stringify(pkg));

      if (pkg.file) {
        formData.append(`file_${index}`, pkg.file);
      }
    });
    console.info("In Save Vendor Method (page.tsx)");
    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="flex flex-col justify-center items-center mx-auto p-10 gap-4">
      <div className="flex flex-col border border-(--secondary) bg-white p-4 rounded-lg gap-4 min-h-1/2 min-w-full xl:min-w-1/4">
        <p className="libre-font text-[20px] mb-6">Vendor Details</p>
        <div>
          <p>Vendor Name</p>
          <CustomInput
            className="w-full"
            onChange={(e) => {
              updateVendorDataToStore({ vendorName: e.target.value });
            }}
          ></CustomInput>
        </div>
        <div>
          <p>Service Type</p>
          <select
            name="services"
            id="serviceDropdown"
            className="border border-(--secondary) rounded-lg w-full"
            defaultValue={1}
            onChange={(e) => {
              updateVendorDataToStore({ serviceId: Number(e.target.value) });
            }}
          >
            {servicesList.map((s, index) => {
              return (
                <option key={index} value={s.id}>
                  {s.serviceName}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <p>Location</p>
          <select
            name="location"
            id="locationDropdown"
            className="border border-(--secondary) rounded-lg w-full"
            defaultValue={1}
            onChange={(e) => {
              updateVendorDataToStore({ locationId: Number(e.target.value) });
            }}
          >
            {locationList.map((l, index) => {
              return (
                <option key={index} value={l.id}>
                  {l.locationName}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <p>Contact</p>
          <CustomInput
            className="w-full"
            onChange={(e) => {
              updateVendorDataToStore({ contact: e.target.value });
            }}
          ></CustomInput>
        </div>
        <div>
          <p>Description</p>
          <CustomTextarea
            className="w-full"
            onChange={(e) => {
              updateVendorDataToStore({ detail: e.target.value });
            }}
          ></CustomTextarea>
        </div>
        <div>
          <p>Rating</p>
          <div className="flex flex-row gap-4 text-[30px]">
            {[1, 2, 3, 4, 5].map((i) => (
              <FaStar
                key={i}
                className={`cursor-pointer ${
                  i <= rating ? "text-amber-400" : "text-gray-300"
                }`}
                onClick={() => {
                  setRating(i);
                  updateVendorDataToStore({ rating: i });
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col border border-(--secondary) bg-white p-4 rounded-lg gap-4 min-h-1/2 min-w-full xl:min-w-1/4">
        <p className="libre-font text-[20px] mb-6">Package Details</p>
        {packageListFromStore.map((p, index) => {
          console.log("current pkg: " + p.name);
          return <PackageDetailSection key={p.id} pkg={p} index={index + 1} />;
        })}

        <div
          className="flex flex-row justify-between items-center w-full border border-dashed border-(--fourth) rounded-lg p-2 cursor-pointer"
          onClick={() => {
            addNewPackage();
          }}
        >
          <p>+ Add a package</p>
        </div>
      </div>

      <MainButton className="min-w-1/4" onClick={() => saveVendor()}>
        Add Vendor
      </MainButton>
    </div>
  );
}
