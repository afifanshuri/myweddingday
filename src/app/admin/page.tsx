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
import { APIGetLocationsAll } from "@/services/api/locations";
import { APICreateVendorWithPackages } from "@/services/api/vendors";
import "@/css/admin.css";

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
      const locationsList = await APIGetLocationsAll();
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
      const data = await APICreateVendorWithPackages(formData);
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
    <main className={`admin-page mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12`}>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-widest text-(--positive-tertiary) uppercase">Vendor administration</p>
          <h1 className="libre-font text-3xl text-(--positive-tertiary) sm:text-4xl">Add a vendor</h1>
          <p className="mt-3 text-sm font-normal text-foreground/60">Create a vendor profile and add the packages couples can explore.</p>
        </div>
        <span className="rounded-full border border-(--tertiary) bg-white px-4 py-2 text-xs text-(--positive-tertiary)">{saved ? "Saved" : "New vendor"}</span>
      </header>
      <fieldset disabled={isSaving || saved} className={`grid min-w-0 gap-6 lg:grid-cols-[0.9fr_1.1fr] ${isSaving || saved ? "pointer-events-none" : ""}`}>
        <section aria-labelledby="vendor-details-heading" className="flex min-w-0 flex-col gap-5 self-start rounded-3xl border border-(--tertiary) bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3 border-b border-(--secondary) pb-5">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--secondary) text-(--positive-tertiary)">01</span>
            <div>
              <h2 id="vendor-details-heading" className="libre-font text-xl">Vendor details</h2>
              <p className="mt-1 text-xs font-normal text-foreground/60">Business information and contact details</p>
            </div>
          </div>
          <div>
            <label htmlFor="vendor-name" className="mb-2 block text-sm">Vendor Name</label>
          <CustomInput
            id="vendor-name"
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
            <label htmlFor="serviceDropdown" className="mb-2 block text-sm">Service Type</label>
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
            <p className="mb-2 text-sm">Locations Covered</p>
            <p className="mb-3 text-xs font-normal text-foreground/60">Select all areas this vendor serves.</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {locationList.map((l) => {
                return (
                  <MainButton variant="choice" size="small"
                    type="button"
                    aria-pressed={vendorFromStore.locationId.includes(l.id)}
                    key={l.id}
                    onClick={() => {
                      toggleSelectLocation(l.id);
                    }}
                  >
                    {l.locationName}
                  </MainButton>
                );
              })}
            </div>
            {errors.locationId ? (
              <p className="text-red-500 text-sm mt-1">{errors.locationId}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="vendor-contact" className="mb-2 block text-sm">Contact</label>
          <CustomInput
            id="vendor-contact"
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
          <div className="flex flex-col gap-4 border-t border-(--secondary) pt-5">
            <p className="text-sm">Social Media <span className="font-normal text-foreground/50">(Optional)</span></p>
            <div className="grid grid-cols-1 gap-4">
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
                  <label htmlFor={`vendor-${key}`} className="text-xs text-foreground/70">{label}</label>
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
            <label htmlFor="vendor-description" className="mb-2 block text-sm">Description</label>
          <CustomTextarea
            id="vendor-description"
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
        </section>
        <section aria-labelledby="package-details-heading" className="flex min-w-0 flex-col gap-5 self-start rounded-3xl border border-(--tertiary) bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3 border-b border-(--secondary) pb-5">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--secondary) text-(--positive-tertiary)">02</span>
            <div className="min-w-0 flex-1">
              <h2 id="package-details-heading" className="libre-font text-xl">Package details</h2>
              <p className="mt-1 text-xs font-normal text-foreground/60">Pricing, inclusions, and package images</p>
            </div>
            <span className="rounded-full bg-(--secondary) px-3 py-1 text-xs">{packageListFromStore.length}</span>
          </div>
          {packageListFromStore.length === 0 && (
            <div className="rounded-2xl bg-(--background) px-5 py-8 text-center">
              <p className="text-sm text-(--positive-tertiary)">No packages added yet</p>
              <p className="mt-2 text-xs font-normal text-foreground/60">Add your first package with its price and what&apos;s included.</p>
            </div>
          )}
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

          <MainButton variant="custom" size="none"
            type="button"
            className="w-full cursor-pointer rounded-2xl border border-dashed border-(--positive-secondary) bg-(--background) px-4 py-4 text-sm text-(--positive-tertiary) transition-colors hover:bg-(--secondary) motion-reduce:transition-none"
            onClick={() => {
              addNewPackage();
            }}
          >
            + Add a package
          </MainButton>
        </section>

        <div className="flex flex-col gap-4 rounded-2xl border border-(--tertiary) bg-white p-5 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
          <p className="text-sm font-normal text-foreground/60">Review the vendor details and packages before saving.</p>
        <MainButton disabled={isSaving || saved} className="w-full px-7 py-3 text-sm text-(--positive-tertiary) disabled:opacity-50 sm:w-auto" onClick={() => handleSaveClick()}>
          {saved ? "Vendor saved" : isSaving ? "Saving..." : "Add Vendor"}
        </MainButton>
        </div>
      </fieldset>
      {saved && <p role="status" className="mt-5 rounded-xl border border-(--positive-secondary) bg-(--positive)/20 p-4 text-sm text-(--positive-tertiary)">Vendor and packages saved successfully.</p>}
      {saved && <MainButton onClick={() => {
        resetDraft();
        setSaved(false);
        setErrors({});
        setSaveError(null);
      }}>Add another vendor</MainButton>}
      {!showConfirm && saveError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{saveError}</p>}

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
    </main>
  );
}
