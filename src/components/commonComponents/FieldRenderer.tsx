"use client";
import MainButton from "@/components/commonComponents/MainButton";

import { CriteriaField, hasCriteriaValue } from "@/config/serviceCriteria";
import CustomInput from "@/components/commonComponents/CustomInput";
import { BsCheckCircle } from "react-icons/bs";
import { useId, type ReactNode } from "react";
import "@/css/field-renderer.css";

interface FieldRendererProps {
  field: CriteriaField;
  value: unknown;
  onChange: (
    key: string,
    value: string | number | boolean | string[] | undefined,
  ) => void;
  required?: boolean;
  onRequiredChange?: (key: string, checked: boolean) => void;
}

export default function FieldRenderer({
  field,
  value,
  onChange,
  required = false,
  onRequiredChange,
}: FieldRendererProps) {
  const inputId = useId();
  const showRequired = Boolean(onRequiredChange && hasCriteriaValue(value));
  const renderField = (control: ReactNode) => (
    <div className="flex flex-col gap-2">
      {field.type === "multi-select" ? (
        <p id={`${inputId}-label`} className="font-medium">{field.label}</p>
      ) : (
        <label htmlFor={inputId} className="font-medium">{field.label}</label>
      )}
      <div
        className="criteria-field-row"
        data-has-value={showRequired}
      >
        <div className="criteria-field-control">{control}</div>
        {onRequiredChange && (
          <div className="criteria-field-required" aria-hidden={!showRequired} inert={!showRequired}>
            <label className="criteria-field-required-label">
              <input
                type="checkbox"
                checked={required}
                disabled={!showRequired}
                aria-label={`${field.label}: Must have`}
                onChange={(e) => onRequiredChange(field.key, e.target.checked)}
                className="h-4 w-4 shrink-0 accent-(--positive-tertiary)"
              />
              Must have
            </label>
          </div>
        )}
      </div>
    </div>
  );

  switch (field.type) {
    case "text":
    case "date":
    case "time":
      return renderField(
        <CustomInput
          id={inputId}
          type={field.type}
          value={typeof value === "string" ? value : ""}
          className="w-full py-2"
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      );
    case "number":
      return renderField(
        <CustomInput
          id={inputId}
          type="number"
          value={typeof value === "number" ? value : ""}
          min={field.min}
          max={field.max}
          step={field.step ?? "any"}
          className="w-full py-2"
          onChange={(e) =>
            onChange(
              field.key,
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
        />
      );

    case "boolean":
      if (onRequiredChange) {
        return renderField(
          <select
            id={inputId}
            aria-label={field.label}
            value={typeof value === "boolean" ? String(value) : ""}
            className="border border-(--secondary) rounded-lg w-full p-2"
            onChange={(e) =>
              onChange(
                field.key,
                e.target.value === "" ? undefined : e.target.value === "true",
              )
            }
          >
            <option value="">No preference</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      }
      return (
        <MainButton
          variant="choice"
          size="small"
          aria-pressed={value === true}
          className="w-full justify-start rounded-lg text-left"
          onClick={() => onChange(field.key, !value)}
        >
          <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center rounded border border-(--positive-secondary)">
            {value === true && <BsCheckCircle className="size-3" />}
          </span>
          <p>{field.label}</p>
        </MainButton>
      );

    case "single-select":
      return renderField(
        <select
          id={inputId}
          value={typeof value === "string" ? value : ""}
          className="border border-(--secondary) rounded-lg w-full p-2"
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          <option value="">-- Pilih --</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "multi-select": {
      const selected: string[] = Array.isArray(value) ? value : [];
      return renderField(
        <div
          role="group"
          aria-labelledby={`${inputId}-label`}
          className="flex flex-row gap-2 flex-wrap"
        >
          {field.options?.map((opt) => (
            <MainButton variant="choice" size="small"
              type="button"
              aria-pressed={selected.includes(opt)}
              key={opt}
              onClick={() => {
                const newVal = selected.includes(opt)
                  ? selected.filter((s) => s !== opt)
                  : [...selected, opt];
                onChange(field.key, newVal);
              }}
              className="text-left"
            >
              <BsCheckCircle
                aria-hidden="true"
                className={`transition ${selected.includes(opt) ? "flex" : "hidden"}`}
              />
              {opt}
            </MainButton>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
