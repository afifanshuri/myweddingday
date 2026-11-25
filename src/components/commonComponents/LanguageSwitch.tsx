"use client";

import { LOCALES, setLocale, useLocale, useT } from "@/i18n";

/** EN | BM. The choice is remembered on this device. */
export default function LanguageSwitch({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  return <div role="group" aria-label={t.language.label}
    className={`inline-flex shrink-0 rounded-full border border-(--tertiary) bg-white p-0.5 text-xs font-medium ${className}`}>
    {LOCALES.map((option) => <button key={option} type="button" lang={option} aria-pressed={locale === option}
      onClick={() => setLocale(option)}
      className={`min-h-8 min-w-9 rounded-full px-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary) ${locale === option ? "bg-(--positive-tertiary) text-white" : "text-(--positive-tertiary) hover:bg-(--secondary)"}`}>
      {t.language[option]}
    </button>)}
  </div>;
}
