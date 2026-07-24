"use client";
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
import { PackageType } from "@/types/basicTypes";
import { useAdminStore } from "@/app/store/adminStore";

export default function PackageDetailSection({
  pkg,
  index,
}: {
  pkg: PackageType;
  index: number;
}) {
  const [displayPackageForm, setDisplayPackageForm] = useState(true);
  const deletePackageFromStore = useAdminStore((state) => state.deletePackage);
  const updatePackageToStore = useAdminStore((state) => state.updatePackage);
  const [currentTag, setCurrentTag] = useState<string>("");

  function onDeletePackage(id: number) {
    console.log("to delete" + id);
    deletePackageFromStore(id);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between items-center w-full bg-(--tertiary) rounded-lg p-2 cursor-pointer">
        <p>{pkg.name !== "" ? pkg.name : "Package " + index}</p>
        <div className="flex flex-row gap-2">
          <BsTrash
            className="text-red-500 cursor-pointer"
            onClick={() => {
              onDeletePackage(pkg.id);
            }}
          />
          <BsChevronRight
            className={`cursor-pointer ${displayPackageForm ? "hidden" : "flex"}`}
            onClick={() => {
              setDisplayPackageForm(true);
            }}
          />
          <BsChevronDown
            className={`cursor-pointer ${displayPackageForm ? "flex" : "hidden"}`}
            onClick={() => {
              setDisplayPackageForm(false);
            }}
          />
        </div>
      </div>
      <div
        className={`bg-(--secondary) p-4 opacity-80 ${displayPackageForm ? "flex flex-col gap-4" : "hidden"}`}
      >
        <div>
          <p>Package Name</p>
          <CustomInput
            type="text"
            className="w-full"
            onChange={(e) => {
              updatePackageToStore(pkg.id, { name: e.target.value });
            }}
            value={pkg.name ?? "Package" + pkg.id}
          ></CustomInput>
        </div>
        <div>
          <p>Package Price</p>
          RM{" "}
          <CustomInput
            type="text"
            className="w-1/4"
            onChange={(e) => {
              updatePackageToStore(pkg.id, { price: Number(e.target.value) });
            }}
            value={pkg.price ?? 0}
          ></CustomInput>
        </div>
        <div>
          <p>Package Description</p>
          <CustomTextarea
            className="w-full"
            onChange={(e) => {
              updatePackageToStore(pkg.id, { details: e.target.value });
            }}
            value={pkg.details ?? ""}
          ></CustomTextarea>
        </div>
        <div className="flex flex-col flex-wrap gap-2">
          <p>Tags</p>
          <div className="flex flex-row gap-1 text-[10px]">
            {pkg.tags.map((t, index) => (
              <div
                key={index}
                className="flex flex-row items-center p-2 border rounded-xl bg-(--fourth)"
              >
                <BsTag className="text-[12px] mr-0.5" />
                {t}
                <BsX
                  className="text-[12px] ml-2 cursor-pointer"
                  onClick={() => {
                    const newTags = pkg.tags.filter((_, i) => i !== index);
                    updatePackageToStore(pkg.id, { tags: newTags });
                  }}
                />
              </div>
            ))}
          </div>

          <CustomInput
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
          <p>Add a file</p>
          <input
            type="file"
            className="cursor-pointer border border-(--fourth) rounded-lg w-3/4 xl:w-full"
            onChange={(e) => {
              console.log(e.target.files?.[0]);
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
