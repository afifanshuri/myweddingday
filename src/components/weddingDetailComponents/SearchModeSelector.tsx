"use client";

export type SearchMode = "manual" | "ai";

export default function SearchModeSelector({
  value,
  onChange,
}: {
  value: SearchMode;
  onChange: (mode: SearchMode) => void;
}) {
  return (
    <fieldset>
      <legend className="libre-font text-2xl">How would you like to search?</legend>
      <p className="mt-2 text-sm font-normal text-foreground/60">
        Your wedding details stay with you when you switch modes.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {([
          { mode: "manual", title: "Manual search", description: "Choose your preferences step by step." },
          { mode: "ai", title: "AI search", description: "Describe your wedding in your own words." },
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
                    Try AI
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
