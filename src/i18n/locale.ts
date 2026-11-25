"use client";

import { useSyncExternalStore } from "react";

export const LOCALES = ["en", "ms"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

const STORAGE_KEY = "myweddingday-locale";
const listeners = new Set<() => void>();

function readLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (LOCALES as readonly string[]).includes(saved ?? "") ? saved as Locale : DEFAULT_LOCALE;
  } catch {
    // Storage blocked (private mode, site data off): English for this visit.
    return DEFAULT_LOCALE;
  }
}

let current: Locale | null = null;
const getLocale = () => (current ??= readLocale());

function subscribe(notify: () => void) {
  listeners.add(notify);
  // Another tab changed the language.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    current = readLocale();
    document.documentElement.lang = current;
    notify();
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(notify); window.removeEventListener("storage", onStorage); };
}

/** The language chosen on this device. The server always renders English; the browser switches after hydration. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, () => DEFAULT_LOCALE);
}

export function setLocale(locale: Locale) {
  current = locale;
  try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* still applies for this visit */ }
  document.documentElement.lang = locale;
  listeners.forEach((notify) => notify());
}
