"use client";
import {
  PreferenceStore,
  usePreferenceStore,
} from "@/app/store/preferenceStore";
import { SERVICE_ID } from "@/constants/commonConstants";
import { useState } from "react";
import { BsCheckCircle } from "react-icons/bs";

export default function StylesSelector({
  currentPath,
}: {
  currentPath: number;
}) {
  const preferenceStore = usePreferenceStore((state) =>
    {
      return state.preferencesList.find((preference) => preference.serviceId === currentPath);
    }
  );

  const updateStyles = usePreferenceStore((state) => state.updatePreferenceDetails);
  const selectedStyles = preferenceStore?.style || [];

  const toggleSelectStyles = (style: string) => {
    const newStyles = selectedStyles.includes(style)
      ? selectedStyles.filter((s) => s !== style)
      : [...selectedStyles, style];
    updateStyles(currentPath, {style:newStyles});
  };
  return (
    <div className="flex flex-row gap-2 flex-wrap">
      {!preferenceStore ? null : preferenceStore.styleOptions.map((style, index) => {
        return (
          <div
            onClick={() => toggleSelectStyles(style)}
            key={index}
            className={`text-[10px] border transition hover:cursor-pointer flex flex-row items-center gap-1 p-2 rounded-2xl ${selectedStyles.includes(style) ? "bg-(--positive) text-white border-(--positive)" : "border-(--positive) text-(--positive-secondary) bg-white"}`}
          >
            <BsCheckCircle
              className={`transition ${selectedStyles.includes(style) ? "flex" : "hidden"}`}
            />
            {style}
          </div>
        );
      })}
    </div>
  );
}
