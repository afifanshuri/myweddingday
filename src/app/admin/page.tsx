"use client";
import PackageDetailSection from "@/components/adminComponents/PackageDetailsSection";
import CustomInput from "@/components/commonComponents/CustomInput";
import CustomTextarea from "@/components/commonComponents/CustomTextarea";
import CustomDialog from "@/components/commonComponents/CustomDialog";
import { LocationType, ServiceType } from "@/types/dataTypes";
import { useEffect, useState } from "react";
import { useAdminStore } from "@/store/adminStore";
import { useServiceStore } from "@/store/serviceStore";
import MainButton from "@/components/commonComponents/MainButton";

type FieldErrors = {
  vendorName?: string;
  serviceId?: string;
  locationId?: string;
  contact?: string;
  detail?: string;
  packages?: { name?: string; price?: string; details?: string }[];
};

export default function AdminPage() {
  const [locationList, setLocationList] = useState<LocationType[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const vendorFromStore = useAdminStore((state) => state.vendor);
  const packageListFromStore = useAdminStore((state) => state.packageList);
  const addPackageToStore = useAdminStore((state) => state.addPackage);
  const updateVendorDataToStore = useAdminStore((state) => state.updateVendor);

  const initServices = useServiceStore((state) => state.initServices);
  const servicesList = useServiceStore((state) => state.service);

  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    async function populateData() {
      const locationsList = await fetch("/api/locations").then((res) =>
        res.json(),
      );
      setLocationList(locationsList);
      await initServices();
    }
    populateData();
  }, [initServices]);

  function toggleSelectLocation(id: number) {
    if (id) {
      if (vendorFromStore.locationId.includes(id)) {
        const newLocationList = vendorFromStore.locationId.filter(
          (l) => l != id,
        );
        updateVendorDataToStore({ locationId: [...newLocationList] });
        setErrors((prev) => {
          const next = { ...prev };
          delete next.locationId;
          return next;
        });
      } else {
        updateVendorDataToStore({
          locationId: [...vendorFromStore.locationId, id],
        });
        setErrors((prev) => {
          const next = { ...prev };
          delete next.locationId;
          return next;
        });
      }
    }
  }

  function addNewPackage() {
    addPackageToStore();
  }

  function validateFields() {
    const newErrors: FieldErrors = {};

    const name = vendorFromStore.vendorName ?? "";
    if (name.toString().trim() === "" || name === "<Vendor Name>") {
      newErrors.vendorName = "Vendor name is required";
    }

    if (!vendorFromStore.serviceId || vendorFromStore.serviceId === 0) {
      newErrors.serviceId = "Service type is required";
    }

    if (
      !vendorFromStore.locationId ||
      vendorFromStore.locationId.length === 0
    ) {
      newErrors.locationId = "At least one location is required";
    }

    const contact = vendorFromStore.contact ?? "";
    if (contact.toString().trim() === "") {
      newErrors.contact = "Contact is required";
    }

    const detail = vendorFromStore.detail ?? "";
    if (detail.toString().trim() === "") {
      newErrors.detail = "Description is required";
    }

    if (!packageListFromStore || packageListFromStore.length === 0) {
      newErrors.packages = [{ name: "At least one package is required" }];
    } else {
      newErrors.packages = [];
      packageListFromStore.forEach((pkg) => {
        const pkgErr: { name?: string; price?: string; details?: string } = {};
        if (!pkg.name || pkg.name.toString().trim() === "") {
          pkgErr.name = "Package name is required";
        }
        if (!pkg.price || Number(pkg.price) === 0) {
          pkgErr.price = "Package price is required";
        }
        const det = pkg.details ?? "";
        if (det.toString().trim() === "") {
          pkgErr.details = "Package description is required";
        }
        newErrors.packages!.push(pkgErr);
      });
    }

    if (
      newErrors.packages &&
      newErrors.packages.every((p) => Object.keys(p).length === 0)
    ) {
      delete newErrors.packages;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleSaveClick() {
    const ok = validateFields();
    if (!ok) return;
    setShowConfirm(true);
  }

  async function saveVendor() {
    try {
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vendorFromStore),
      });

      if (response.ok) {
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
    try {
      await fetch("/api/packages", {
        method: "POST",
        body: formData,
      });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="flex flex-col justify-center items-center mx-auto p-10 gap-4">
      <div className="flex flex-col border border-(--secondary) bg-white p-4 rounded-lg gap-4 min-h-1/2 min-w-full xl:min-w-1/2">
        <p className="libre-font text-[20px] mb-6">Vendor Details</p>
        <div>
          <p>Vendor Name</p>
          <CustomInput
            className="w-full"
            onChange={(e) => {
              updateVendorDataToStore({ vendorName: e.target.value });
              setErrors((prev) => {
                const next = { ...prev };
                delete next.vendorName;
                return next;
              });
            }}
          ></CustomInput>
          {errors.vendorName ? (
            <p className="text-red-500 text-sm mt-1">{errors.vendorName}</p>
          ) : null}
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
              setErrors((prev) => {
                const next = { ...prev };
                delete next.serviceId;
                return next;
              });
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
          {errors.serviceId ? (
            <p className="text-red-500 text-sm mt-1">{errors.serviceId}</p>
          ) : null}
        </div>
        <div>
          <p>Locations Covered</p>
          <div className="flex flex-row gap-2 text-[10px]">
            {locationList.map((l) => {
              return (
                <div
                  key={l.id}
                  className={`${vendorFromStore.locationId.includes(l.id) ? "bg-(--positive) border-(--positive)" : "bg-white border-(--tertiary)"} cursor-pointer hover:bg-(--positive) p-2 border rounded-lg`}
                  onClick={() => {
                    toggleSelectLocation(l.id);
                  }}
                >
                  {l.locationName}
                </div>
              );
            })}
          </div>
          {errors.locationId ? (
            <p className="text-red-500 text-sm mt-1">{errors.locationId}</p>
          ) : null}
        </div>
        <div>
          <p>Contact</p>
          <CustomInput
            className="w-full"
            onChange={(e) => {
              updateVendorDataToStore({ contact: e.target.value });
              setErrors((prev) => {
                const next = { ...prev };
                delete next.contact;
                return next;
              });
            }}
          ></CustomInput>
          {errors.contact ? (
            <p className="text-red-500 text-sm mt-1">{errors.contact}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-4">
          <p className="font-medium">Social Media (Optional)</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(
              [
                {
                  key: "instagram",
                  label: "Instagram (IG)",
                  placeholder: "https://www.instagram.com/yourprofile",
                },
                {
                  key: "tiktok",
                  label: "TikTok",
                  placeholder: "https://www.tiktok.com/@yourprofile",
                },
                {
                  key: "facebook",
                  label: "Facebook (FB)",
                  placeholder: "https://www.facebook.com/yourpage",
                },
              ] as const
            ).map(({ key, label, placeholder }) => (
              <div key={key} className="flex flex-col gap-2">
                <label htmlFor={`vendor-${key}`}>{label}</label>
                <CustomInput
                  id={`vendor-${key}`}
                  name={key}
                  type="url"
                  maxLength={200}
                  placeholder={placeholder}
                  className="w-full"
                  value={vendorFromStore[key] ?? ""}
                  onChange={(e) =>
                    updateVendorDataToStore({ [key]: e.target.value || null })
                  }
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <p>Description</p>
          <CustomTextarea
            className="w-full"
            onChange={(e) => {
              updateVendorDataToStore({ detail: e.target.value });
              setErrors((prev) => {
                const next = { ...prev };
                delete next.detail;
                return next;
              });
            }}
          ></CustomTextarea>
          {errors.detail ? (
            <p className="text-red-500 text-sm mt-1">{errors.detail}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col border border-(--secondary) bg-white p-4 rounded-lg gap-4 min-h-1/2 min-w-full xl:min-w-1/2">
        <p className="libre-font text-[20px] mb-6">Package Details</p>
        {packageListFromStore.map((p, index) => {
          return (
            <PackageDetailSection
              key={p.id}
              pkg={p}
              index={index}
              pkgError={errors.packages?.[index] ?? null}
              onFieldChange={(field) => {
                setErrors((prev) => {
                  if (!prev.packages) return prev;
                  const packages = [...prev.packages];
                  const pkgErr = { ...(packages[index] || {}) };
                  delete (pkgErr as any)[field];
                  packages[index] = pkgErr;
                  const next = { ...prev, packages };
                  if (
                    packages.every((pe) => Object.keys(pe || {}).length === 0)
                  ) {
                    delete (next as any).packages;
                  }
                  return next;
                });
              }}
            />
          );
        })}
        {packageListFromStore.length === 0 && errors.packages?.[0]?.name ? (
          <p className="text-red-500 text-sm mt-1">{errors.packages[0].name}</p>
        ) : null}

        <div
          className="flex flex-row justify-between items-center w-full border border-dashed border-(--fourth) rounded-lg p-2 cursor-pointer"
          onClick={() => {
            addNewPackage();
          }}
        >
          <p>+ Add a package</p>
        </div>
      </div>

      <MainButton className="min-w-1/4" onClick={() => handleSaveClick()}>
        Add Vendor
      </MainButton>

      <CustomDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => saveVendor()}
        title="Confirm Save"
      >
        <p>Are you sure you want to save this vendor?</p>
      </CustomDialog>
    </div>
  );
}
