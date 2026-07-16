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
  function getPreferenceStoreById(id: number, state: PreferenceStore) {
    switch (id) {
      case SERVICE_ID.VENUE:
        return state.venuePreference;
      case SERVICE_ID.PELAMIN:
        return state.pelaminPreference;
      case SERVICE_ID.CATERING:
        return state.cateringPreference;
      case SERVICE_ID.PHOTOGRAPHER:
        return state.photographerPreference;
      case SERVICE_ID.MUA:
        return state.muaPreference;
      case SERVICE_ID.CLOTHING:
        return state.clothingPreference;
      default:
        throw new Error(`Unknown service id: ${id}`);
    }
  }
  const preferenceStore = usePreferenceStore((state) =>
    getPreferenceStoreById(currentPath, state),
  );
  const setStyleToStore = usePreferenceStore((state) => state.setStyles);
  const selectedStyles = preferenceStore.style;

  const toggleSelectStyles = (style: string) => {
    const newStyles = selectedStyles.includes(style)
      ? selectedStyles.filter((s) => s !== style)
      : [...selectedStyles, style];
    setStyleToStore(currentPath, newStyles);
  };
  return (
    <div className="flex flex-row gap-2 flex-wrap">
      {preferenceStore.styleOptions.map((style, index) => {
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
