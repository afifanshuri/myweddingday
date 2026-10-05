"use client";
import PackageDetailSection from "@/components/adminComponents/PackageDetailsSection";
import CustomInput from "@/components/commonComponents/CustomInput";
import CustomTextarea from "@/components/commonComponents/CustomTextarea";
import CustomDialog from "@/components/commonComponents/CustomDialog";
import { LocationType } from "@/types/dataTypes";
import { useEffect, useRef, useState } from "react";
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const savingRef = useRef(false);

  const vendorFromStore = useAdminStore((state) => state.vendor);
  const packageListFromStore = useAdminStore((state) => state.packageList);
  const addPackageToStore = useAdminStore((state) => state.addPackage);
  const updateVendorDataToStore = useAdminStore((state) => state.updateVendor);
  const resetDraft = useAdminStore((state) => state.resetDraft);

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
        if (!Number.isFinite(pkg.price) || pkg.price <= 0) {
          pkgErr.price = "Package price must be a positive number";
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
    if (savingRef.current || saved) return;
    setSaveError(null);
    const ok = validateFields();
    if (!ok) return;
    setShowConfirm(true);
  }

  async function saveVendor() {
    if (savingRef.current || saved) return;
    savingRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    try {
      const formData = new FormData();
      // Send only creation fields; rating is controlled by the server.
      const { vendorName, serviceId, locationId, contact, detail, instagram, facebook, tiktok } = vendorFromStore;
      formData.append("payload", JSON.stringify({
        vendor: { vendorName, serviceId, locationId, contact, detail, instagram, facebook, tiktok },
        packages: packageListFromStore.map(({ name, price, details, filters }) => ({ name, price, details, filters })),
      }));
      packageListFromStore.forEach((pkg, index) => {
        if (pkg.file) formData.append(`file_${index}`, pkg.file);
      });
      const response = await fetch("/api/vendors", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save vendor");
      updateVendorDataToStore({ id: data.id });
      setSaved(true);
      setShowConfirm(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Unable to save vendor");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col justify-center items-center mx-auto p-10 gap-4">
      <fieldset disabled={isSaving || saved} className={`contents ${isSaving || saved ? "pointer-events-none" : ""}`}>
        <div className="flex flex-col border border-(--secondary) bg-white p-4 rounded-lg gap-4 min-h-1/2 min-w-full xl:min-w-1/2">
          <p className="libre-font text-[20px] mb-6">Vendor Details</p>
          <div>
            <p>Vendor Name</p>
          <CustomInput
            className="w-full"
            value={vendorFromStore.vendorName === "<Vendor Name>" ? "" : vendorFromStore.vendorName}
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
              value={vendorFromStore.serviceId}
              onChange={(e) => {
                updateVendorDataToStore({ serviceId: Number(e.target.value) });
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.serviceId;
                  return next;
                });
              }}
            >
              <option value={0}>Select service</option>
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
            value={vendorFromStore.contact ?? ""}
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
            value={vendorFromStore.detail ?? ""}
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
                    delete pkgErr[field];
                    packages[index] = pkgErr;
                    const next: FieldErrors = { ...prev, packages };
                    if (
                      packages.every((pe) => Object.keys(pe || {}).length === 0)
                    ) {
                      delete next.packages;
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

        <MainButton disabled={isSaving || saved} className="min-w-1/4 disabled:opacity-50" onClick={() => handleSaveClick()}>
          {saved ? "Vendor saved" : isSaving ? "Saving..." : "Add Vendor"}
        </MainButton>
      </fieldset>
      {saved && <p role="status">Vendor and packages saved successfully.</p>}
      {saved && <MainButton onClick={() => {
        resetDraft();
        setSaved(false);
        setErrors({});
        setSaveError(null);
      }}>Add another vendor</MainButton>}
      {!showConfirm && saveError && <p role="alert" className="text-red-600">{saveError}</p>}

      <CustomDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => saveVendor()}
        busy={isSaving}
        title="Confirm Save"
      >
        <p>Are you sure you want to save this vendor?</p>
        {saveError && <p role="alert" className="mt-2 text-red-600">{saveError}</p>}
      </CustomDialog>
    </div>
  );
}
