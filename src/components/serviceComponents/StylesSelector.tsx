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
        return {
          serviceId: 0,
          budget: 0,
          description: "",
          style: [],
          styleOptions: [],
        };
    }
  }
  const preferenceStore = usePreferenceStore((state) =>
    getPreferenceStoreById(currentPath, state),
  );
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    preferenceStore.style,
  );

  const toggleSelectStyles = (style: string) => {
    setSelectedStyles(
      selectedStyles.includes(style)
        ? selectedStyles.filter((s) => s !== style)
        : [...selectedStyles, style],
    );
  };
  return (
    <div className="flex flex-row gap-2 flex-wrap">
      {preferenceStore.styleOptions.map((style, index) => {
        return (
          <div
            onClick={() => toggleSelectStyles(style)}
            key={index}
            className={`transition hover:cursor-pointer flex flex-row items-center gap-2 p-2 border rounded-2xl opacity-40 hover:opacity-100 ${selectedStyles.includes(style) ? "opacity-100" : "opacity-40"}`}
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
