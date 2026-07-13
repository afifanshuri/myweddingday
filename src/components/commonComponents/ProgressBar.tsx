"use client";
import { useServiceStore } from "@/app/store/serviceStore";
import { ClassnameType } from "@/types/basicTypes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ProgressBar = ({
  className = "",
  currentPath,
}: {
  className: string;
  currentPath: number;
}) => {
  const selectedServices = useServiceStore((state) => state.selectedService);
  const totalSelectedServices = selectedServices.length;
  const currentIndex = selectedServices.findIndex((i) => i === currentPath);
  const index = currentIndex >= 0 ? currentIndex + 1 : 0;
  const progressPercentage = (index / totalSelectedServices) * 100;
  console.log(progressPercentage);

  return (
    <div className={className}>
      <div id="progressBarText">
        Step {index} of {totalSelectedServices}
      </div>
      <div id="progressBar" className="border rounded-lg w-full">
        <div
          className="bg-black h-1 transition"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export { ProgressBar };
