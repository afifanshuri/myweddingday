"use client";

import { useT } from "@/i18n";

export type SearchMode = "manual" | "ai";

export default function SearchModeSelector({
  value,
  onChange,
}: {
  value: SearchMode;
  onChange: (mode: SearchMode) => void;
}) {
  const t = useT();
  return (
    <fieldset>
      <legend className="libre-font text-2xl">{t.planner.mode.legend}</legend>
      <p className="mt-2 text-sm font-normal text-foreground/60">
        {t.planner.mode.hint}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {([
          { mode: "manual", title: t.planner.mode.manual, description: t.planner.mode.manualHint },
          { mode: "ai", title: t.planner.mode.ai, description: t.planner.mode.aiHint },
        ] as const).map(({ mode, title, description }) => (
          <label key={mode} className="cursor-pointer">
            <input
              type="radio"
              name="search-mode"
              value={mode}
              checked={value === mode}
              onChange={() => onChange(mode)}
              className="peer sr-only"
            />
            <span className="flex h-full flex-col gap-2 rounded-2xl border border-(--tertiary) bg-white p-5 transition peer-checked:border-(--positive-secondary) peer-checked:bg-(--secondary) peer-checked:ring-1 peer-checked:ring-(--positive-secondary) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-(--positive-tertiary)">
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold">{title}</span>
                {mode === "ai" && (
                  <span className="rounded-full bg-(--positive)/30 px-2 py-1 text-xs text-(--positive-tertiary)">
                    {t.planner.mode.tryAi}
                  </span>
                )}
              </span>
              <span className="text-sm font-normal text-foreground/65">{description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
