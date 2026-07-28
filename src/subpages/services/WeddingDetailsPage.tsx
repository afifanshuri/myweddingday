"use client"
import { useAdminStore } from "@/app/store/adminStore";
import { usePreferenceStore } from "@/app/store/preferenceStore";
import CustomInput from "@/components/commonComponents/CustomInput";
import { LocationType } from "@/types/dataTypes";
import { useState } from "react";

export default function WeddingDetailsPage({locations}:{locations:LocationType[]}) {
  
  const weddingDetailsFromStore = usePreferenceStore((state) => state.weddingDetails);
  const vendorFromStore = useAdminStore((state) => state.vendor);
  const updateWeddingDetails = usePreferenceStore((state) => state.updateWeddingDetails);
  const toggleSelectLocation = (id:number) => {
    const newLocationlist = weddingDetailsFromStore.locations.includes(id) ?
    weddingDetailsFromStore.locations.filter((l) => l != id) : [...weddingDetailsFromStore.locations,id];
    updateWeddingDetails({locations:newLocationlist});
  }

  return (
    <div className="mb-10">
      <p className="opacity-50 font-light mb-4">Let&apos;s get started!</p>
      <p className="mb-4 libre-font xl:text-[20px]">
        1. Tell Us About Your Wedding
      </p>
      <div className="flex flex-col gap-8">
        <div className="w-full">
          <p>Couple&apos;s Names</p>
          <CustomInput
          value={weddingDetailsFromStore.coupleName}
            type="text"
            placeholder="e.g. Amira & Syafiq"
            className="w-full"
            onChange={(e) => {updateWeddingDetails({coupleName:e.target.value})}}
          ></CustomInput>
        </div>
        <div className="flex flex-row gap-4">
          <div className="w-full">
            <p>Wedding Date</p>
            <CustomInput
            value ={weddingDetailsFromStore.date
      ? weddingDetailsFromStore.date.toISOString().split("T")[0]
      : ""
              }
              type="date"
              placeholder="e.g. Amira & Syafiq"
              className="w-full"
              onChange={(e) => {updateWeddingDetails({date:new Date(e.target.value)})}}
            ></CustomInput>
          </div>
          <div className="w-full">
            <p>Estimated Guests</p>
            <CustomInput
            value ={weddingDetailsFromStore.pax}
              type="number"
              className="w-full"
              onChange={(e) => {updateWeddingDetails({pax:Number(e.target.value)})}}
            ></CustomInput>
          </div>
        </div>

        <div>
          <p>Vendor Locations</p>
          <div className="flex flex-row gap-2 text-[10px]">
            {locations.map((l) => {
              return (
                <div key={l.id} className={`${weddingDetailsFromStore.locations.includes(l.id) ? "bg-(--positive) border-(--positive)" : "bg-white border-(--tertiary)"} cursor-pointer hover:bg-(--positive) p-2 border rounded-lg`} onClick={() => {toggleSelectLocation(l.id)}}>
                  {l.locationName}
                </div>
              );
            })}
          </div>
          </div>

      </div>
    </div>
  );
}
