"use client";

import en, { type Messages } from "./messages/en";
import ms from "./messages/ms";
import { useLocale, type Locale } from "./locale";
import type { CriteriaField } from "@/config/serviceCriteria";

export { useLocale, setLocale, LOCALES, type Locale } from "./locale";
export type { Messages };

const MESSAGES: Record<Locale, Messages> = { en, ms };

/** The text for the language chosen on this device. */
export function useT(): Messages {
  return MESSAGES[useLocale()];
}

/** A service's name in the chosen language; falls back to the name from the database. */
export const serviceName = (t: Messages, id: number, fromDatabase?: string) =>
  t.services[id] ?? fromDatabase ?? t.serviceFallback(id);

/** A planner field's label and an option's label. Only what's shown changes; the stored value stays the same. */
export const criteriaLabel = (t: Messages, field: Pick<CriteriaField, "key" | "label">) => t.criteria.labels[field.key] ?? field.label;
export const optionLabel = (t: Messages, value: string) => t.criteria.options[value] ?? value;
