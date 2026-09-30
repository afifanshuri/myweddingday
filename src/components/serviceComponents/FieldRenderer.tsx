"use client";
import { CriteriaField } from "@/config/serviceCriteria";
import CustomInput from "@/components/commonComponents/CustomInput";
import { BsCheckCircle } from "react-icons/bs";

interface FieldRendererProps {
  field: CriteriaField;
  value: unknown;
  onChange: (
    key: string,
    value: string | number | boolean | string[] | undefined,
  ) => void;
}

export default function FieldRenderer({
  field,
  value,
  onChange,
}: FieldRendererProps) {
  switch (field.type) {
    case "text":
    case "date":
    case "time":
      return (
        <div>
          <p>{field.label}</p>
          <CustomInput
            type={field.type}
            value={typeof value === "string" ? value : ""}
            className="w-full"
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </div>
      );
    case "number":
      return (
        <div>
          <p>{field.label}</p>
          <CustomInput
            type="number"
            value={typeof value === "number" ? value : ""}
            min={field.min}
            max={field.max}
            step={field.step ?? "any"}
            className="w-full"
            onChange={(e) =>
              onChange(
                field.key,
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
          />
        </div>
      );

    case "boolean":
      return (
        <div
          className={`flex flex-row items-center gap-2 p-2 border rounded-lg cursor-pointer transition ${
            value
              ? "bg-(--positive) border-(--positive)"
              : "bg-white border-(--tertiary)"
          }`}
          onClick={() => onChange(field.key, !value)}
        >
          <input
            type="checkbox"
            checked={value === true}
            readOnly
            className="accent-(--positive-tertiary)"
          />
          <p>{field.label}</p>
        </div>
      );

    case "single-select":
      return (
        <div>
          <p>{field.label}</p>
          <select
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
        </div>
      );

    case "multi-select": {
      const selected: string[] = Array.isArray(value) ? value : [];
      return (
        <div>
          <p>{field.label}</p>
          <div className="flex flex-row gap-2 flex-wrap">
            {field.options?.map((opt) => (
              <div
                key={opt}
                onClick={() => {
                  const newVal = selected.includes(opt)
                    ? selected.filter((s) => s !== opt)
                    : [...selected, opt];
                  onChange(field.key, newVal);
                }}
                className={`text-[10px] border transition cursor-pointer flex flex-row items-center gap-1 p-2 rounded-2xl ${
                  selected.includes(opt)
                    ? "bg-(--positive) text-white border-(--positive)"
                    : "border-(--positive) text-(--positive-secondary) bg-white"
                }`}
              >
                <BsCheckCircle
                  className={`transition ${selected.includes(opt) ? "flex" : "hidden"}`}
                />
                {opt}
              </div>
            ))}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
