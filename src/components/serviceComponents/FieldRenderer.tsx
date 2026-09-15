"use client";
import { CriteriaField } from "@/config/serviceCriteria";
import CustomInput from "@/components/commonComponents/CustomInput";
import { BsCheckCircle } from "react-icons/bs";

interface FieldRendererProps {
  field: CriteriaField;
  value: any;
  onChange: (key: string, value: any) => void;
}

export default function FieldRenderer({
  field,
  value,
  onChange,
}: FieldRendererProps) {
  switch (field.type) {
    case "number":
      return (
        <div>
          <p>{field.label}</p>
          <CustomInput
            type="number"
            value={value ?? ""}
            className="w-full"
            onChange={(e) => onChange(field.key, Number(e.target.value))}
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
            checked={value ?? false}
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
            value={value ?? ""}
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
      const selected: string[] = value ?? [];
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
