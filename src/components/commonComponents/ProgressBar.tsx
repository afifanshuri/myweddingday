"use client";
import { usePreferenceStore } from "@/store/preferenceStore";

const ProgressBar = ({
  className = "",
  currentPath,
}: {
  className: string;
  currentPath: number;
}) => {
  const selectedServices = usePreferenceStore(
    (state) => state.weddingDetails.services,
  );
  const totalSelectedServices = selectedServices.length;
  const currentIndex = selectedServices.findIndex((i) => i === currentPath);
  const index = currentIndex >= 0 ? currentIndex + 1 : 0;
  const progressPercentage = (index / totalSelectedServices) * 100;

  return (
    <div className={className}>
      <div id="progressBarText">
        Step {index} of {totalSelectedServices}
      </div>
      <div
        id="progressBar"
        className="border border-(--positive-tertiary) rounded-lg w-full"
      >
        <div
          className="bg-(--positive-tertiary) h-1 transition"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export { ProgressBar };
