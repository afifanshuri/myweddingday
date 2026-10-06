"use client";

import { useState, type CSSProperties } from "react";
import CustomInput from "@/components/commonComponents/CustomInput";
import { SERVICE_ID } from "@/config/serviceCriteria";
import type { ServiceType } from "@/types/dataTypes";
import "@/css/budget-input.css";

export default function AIBudgetInput({
  service,
  budget,
  hasError = false,
  className = "",
  onChange,
}: {
  service: Pick<ServiceType, "id" | "serviceName">;
  budget: number;
  hasError?: boolean;
  className?: string;
  onChange: (budget: number) => void;
}) {
  const isCatering = service.id === SERVICE_ID.CATERING;
  const [sliderMax, setSliderMax] = useState(() =>
    Math.max(isCatering ? 200 : 100000, Number.isFinite(budget) ? budget : 0),
  );
  const max = Math.max(sliderMax, Number.isFinite(budget) ? budget : 0);
  const sliderValue = Number.isFinite(budget) ? Math.max(1, budget) : 1;
  const progress = ((sliderValue - 1) / (max - 1)) * 100;
  const formattedBudget = budget
    ? budget.toLocaleString("en-MY", { maximumFractionDigits: 20 })
    : "—";

  function changeBudget(value: number) {
    // Keep the slider's scale stable after a larger amount is entered manually.
    setSliderMax(Math.max(max, Number.isFinite(value) ? value : 0));
    onChange(value);
  }

  return (
    <div className={`budget-input-card ${className}`}>
      <div className="budget-input-header">
        <div className="budget-input-heading">
          <label htmlFor={`ai-budget-${service.id}`} className="budget-input-label">
            {service.serviceName}
          </label>
          <p className="budget-input-subtitle">
            {isCatering ? "Budget per guest" : "Total budget"}
          </p>
        </div>
        <div className={`budget-input-amount-group ${formattedBudget.length > 9 ? "budget-input-long-amount" : ""}`}>
          <span aria-hidden="true">RM</span>
          <div className="budget-input-amount-field" style={{ width: `${Math.max(4, formattedBudget.length)}ch` }}>
            <span aria-hidden="true" className="budget-input-formatted-amount">
              {formattedBudget}
            </span>
            <CustomInput
              id={`ai-budget-${service.id}`}
              type="number"
              min={1}
              max={1000000000}
              step="any"
              value={budget || ""}
              className="budget-input-amount"
              aria-invalid={hasError}
              aria-describedby={hasError ? "ai-budget-error" : undefined}
              onChange={(event) => changeBudget(Number(event.target.value))}
            />
          </div>
        </div>
      </div>
      <input
        type="range"
        min={1}
        max={max}
        step="any"
        value={sliderValue}
        aria-label={`${service.serviceName} budget slider`}
        aria-valuetext={`RM${budget || 1}${isCatering ? " per guest" : ""}`}
        className="budget-input-slider"
        style={{ "--budget-progress": `${progress}%` } as CSSProperties}
        onChange={(event) =>
          changeBudget(Math.round(Number(event.target.value)))
        }
      />
      <div
        aria-hidden="true"
        className="budget-input-range-labels"
      >
        <span>RM1</span>
        <span>RM{max.toLocaleString("en-MY")}</span>
      </div>
    </div>
  );
}
