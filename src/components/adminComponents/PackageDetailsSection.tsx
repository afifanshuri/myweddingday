"use client";
import MainButton from "@/components/commonComponents/MainButton";

import {
  BsChevronDown,
  BsChevronRight,
  BsTag,
  BsTrash,
  BsX,
} from "react-icons/bs";
import CustomInput from "../commonComponents/CustomInput";
import CustomTextarea from "../commonComponents/CustomTextarea";
import { useState } from "react";
import { PackageType } from "@/types/dataTypes";
import { useAdminStore } from "@/store/adminStore";
import FieldRenderer from "../commonComponents/FieldRenderer";
import {
  clearHiddenCriteria,
  isCriteriaVisible,
  SERVICE_CRITERIA,
} from "@/config/serviceCriteria";

export default function PackageDetailSection({
  pkg,
  index,
  pkgError,
  onFieldChange,
}: {
  pkg: PackageType;
  index: number;
  pkgError?: { name?: string; price?: string; details?: string } | null;
  onFieldChange?: (field: "name" | "price" | "details") => void;
}) {
  const [displayPackageForm, setDisplayPackageForm] = useState(true);
  const deletePackageFromStore = useAdminStore((state) => state.deletePackage);
  const updatePackageToStore = useAdminStore((state) => state.updatePackage);
  const vendorServiceId = useAdminStore((state) => state.vendor.serviceId);
  const [currentTag, setCurrentTag] = useState<string>("");

  const fields = SERVICE_CRITERIA[vendorServiceId] ?? [];

  function onDeletePackage(id: number) {
    deletePackageFromStore(id);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-(--tertiary)">
      <div className="flex items-center justify-between gap-3 bg-(--secondary)/70 px-4 py-3">
        <p className="min-w-0 break-words text-sm text-(--positive-tertiary)">
          {pkg.name !== "" ? pkg.name : "Package " + (index + 1)}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <MainButton
            variant="danger"
            size="icon"
            type="button"
            aria-label={`Delete package ${index + 1}`}
            onClick={() => {
              onDeletePackage(pkg.id);
            }}
          >
            <BsTrash aria-hidden="true" />
          </MainButton>
          <MainButton
            variant="ghost"
            size="icon"
            type="button"
            aria-label={`Expand package ${index + 1}`}
            aria-expanded={false}
            className={displayPackageForm ? "hidden" : ""}
            onClick={() => {
              setDisplayPackageForm(true);
            }}
          >
            <BsChevronRight aria-hidden="true" />
          </MainButton>
          <MainButton
            variant="ghost"
            size="icon"
            type="button"
            aria-label={`Collapse package ${index + 1}`}
            aria-expanded={true}
            className={displayPackageForm ? "" : "hidden"}
            onClick={() => {
              setDisplayPackageForm(false);
            }}
          >
            <BsChevronDown aria-hidden="true" />
          </MainButton>
        </div>
      </div>
      <div
        className={`bg-white p-4 sm:p-5 ${displayPackageForm ? "flex flex-col gap-5" : "hidden"}`}
      >
        <div>
          <label
            htmlFor={`package-name-${pkg.id}`}
            className="mb-2 block text-sm"
          >
            Package Name
          </label>
          <CustomInput
            id={`package-name-${pkg.id}`}
            type="text"
            className="w-full"
            onChange={(e) => {
              updatePackageToStore(pkg.id, { name: e.target.value });
              onFieldChange?.("name");
            }}
            value={pkg.name ?? "Package" + pkg.id}
          ></CustomInput>
          {pkgError?.name ? (
            <p className="text-red-500 text-sm mt-1">{pkgError.name}</p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor={`package-price-${pkg.id}`}
            className="mb-2 block text-sm"
          >
            Package Price
          </label>
          <div className="flex items-center gap-3">
            <span className="text-sm text-(--positive-tertiary)">RM</span>
            <CustomInput
              id={`package-price-${pkg.id}`}
              type="text"
              className="min-w-0 w-full"
              onChange={(e) => {
                updatePackageToStore(pkg.id, { price: Number(e.target.value) });
                onFieldChange?.("price");
              }}
              value={pkg.price ?? 0}
            ></CustomInput>
          </div>
          {pkgError?.price ? (
            <p className="text-red-500 text-sm mt-1">{pkgError.price}</p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor={`package-description-${pkg.id}`}
            className="mb-2 block text-sm"
          >
            Package Description
          </label>
          <CustomTextarea
            id={`package-description-${pkg.id}`}
            className="w-full"
            onChange={(e) => {
              updatePackageToStore(pkg.id, { details: e.target.value });
              onFieldChange?.("details");
            }}
            value={pkg.details ?? ""}
          ></CustomTextarea>
          {pkgError?.details ? (
            <p className="text-red-500 text-sm mt-1">{pkgError.details}</p>
          ) : null}
        </div>

        {/* Config-driven filter fields based on vendor's service */}
        {fields.length > 0 && (
          <div className="flex flex-col gap-4 rounded-xl border border-(--secondary) bg-(--background) p-4 text-sm">
            <p className="text-xs font-semibold tracking-wide text-(--positive-tertiary) uppercase">
              Service Filters
            </p>
            {fields
              .filter((field) =>
                isCriteriaVisible(field, pkg.filters ?? {}, fields),
              )
              .map((field) => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={pkg.filters?.[field.key]}
                  onChange={(key, value) => {
                    updatePackageToStore(pkg.id, {
                      filters: clearHiddenCriteria(fields, {
                        ...(pkg.filters ?? {}),
                        [key]: value,
                      }),
                    });
                  }}
                />
              ))}
          </div>
        )}

        <div className="flex flex-col flex-wrap gap-2">
          <label htmlFor={`package-tags-${pkg.id}`} className="text-sm">
            Tags
          </label>
          <p className="text-xs font-normal text-foreground/60">
            Type a tag and press Enter to add it.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {pkg.tags.map((t, index) => (
              <div
                key={index}
                className="flex items-center rounded-full border border-(--tertiary) bg-(--secondary) py-1.5 pr-1.5 pl-3 text-(--positive-tertiary)"
              >
                <BsTag className="text-[12px] mr-0.5" />
                {t}
                <MainButton
                  variant="ghost"
                  size="icon"
                  type="button"
                  aria-label={`Remove tag ${t}`}
                  className="ml-2 flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-(--tertiary)"
                  onClick={() => {
                    const newTags = pkg.tags.filter((_, i) => i !== index);
                    updatePackageToStore(pkg.id, { tags: newTags });
                  }}
                >
                  <BsX aria-hidden="true" className="size-4" />
                </MainButton>
              </div>
            ))}
          </div>

          <CustomInput
            id={`package-tags-${pkg.id}`}
            type="text"
            placeholder="e.g. Modern, outdoor, malay traditional..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updatePackageToStore(pkg.id, {
                  tags: [...pkg.tags, currentTag],
                });
                setCurrentTag("");
              }
            }}
            onChange={(e) => setCurrentTag(e.target.value)}
            value={currentTag ?? ""}
          ></CustomInput>
        </div>
        <div className="flex flex-col">
          <label htmlFor={`package-file-${pkg.id}`} className="mb-2 text-sm">
            Package image
          </label>
          <p className="mb-3 text-xs font-normal text-foreground/60">
            Upload a JPG, PNG, or WebP image.
          </p>
          <input
            id={`package-file-${pkg.id}`}
            type="file"
            multiple={true}
            accept="image/jpeg,image/png,image/webp"
            className="w-full cursor-pointer rounded-xl border border-dashed border-(--fourth) bg-(--background)"
            onChange={(e) => {
              updatePackageToStore(pkg.id, {
                file: e.target.files?.[0],
              });
            }}
          ></input>
        </div>
      </div>
    </div>
  );
}
