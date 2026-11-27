"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/i18n";
import { CAPTCHA } from "@/config/auth";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }

let scriptLoading: Promise<Turnstile> | null = null;
function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptLoading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CAPTCHA.scriptUrl;
    script.async = true;
    script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error("CAPTCHA did not load"));
    script.onerror = () => { scriptLoading = null; reject(new Error("CAPTCHA did not load")); };
    document.head.appendChild(script);
  });
  return scriptLoading;
}

/**
 * Cloudflare Turnstile for the auth forms. Supabase checks the token itself (Authentication > Attack Protection).
 * The widget is invisible unless Cloudflare wants the visitor to tick a box, and it runs only when a form is sent.
 * Without NEXT_PUBLIC_TURNSTILE_SITE_KEY it does nothing and `getToken` resolves to undefined, so the forms work as
 * before (turn CAPTCHA on in Supabase only once the key is set, or every sign-in fails).
 *
 * Usage: render `widget` inside the form, `await getToken()` right before the Supabase call, `reset()` after it
 * (a token works once).
 */
export function useCaptcha() {
  const locale = useLocale();
  // A state ref, so a widget that appears later (inside a form that opens) still gets rendered.
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const pending = useRef<{ resolve: (token: string) => void; reject: (error: Error) => void } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!CAPTCHA.siteKey || !element) return;
    let cancelled = false;
    loadTurnstile().then((turnstile) => {
      if (cancelled) return;
      widgetId.current = turnstile.render(element, {
        sitekey: CAPTCHA.siteKey,
        execution: "execute",
        appearance: "interaction-only",
        language: locale === "ms" ? "ms" : "en",
        callback: (token: string) => { pending.current?.resolve(token); pending.current = null; },
        "error-callback": () => { pending.current?.reject(new Error("captcha")); pending.current = null; return true; },
        "timeout-callback": () => { pending.current?.reject(new Error("captcha")); pending.current = null; },
      });
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [element, locale]);

  const getToken = useCallback(async (): Promise<string | undefined> => {
    if (!CAPTCHA.siteKey) return undefined;
    // The script may still be loading on a very fast submit: wait a little for the widget.
    for (let waited = 0; !widgetId.current && waited < CAPTCHA.loadWaitMs; waited += 100) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const id = widgetId.current;
    if (!id || !window.turnstile) throw new Error("captcha");
    const turnstile = window.turnstile;
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => { pending.current = null; reject(new Error("captcha")); }, CAPTCHA.solveWaitMs);
      pending.current = {
        resolve: (token) => { clearTimeout(timer); resolve(token); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      };
      turnstile.execute(id);
    });
  }, []);

  const reset = useCallback(() => {
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  }, []);

  const widget = CAPTCHA.siteKey ? <div ref={setElement} className="flex justify-center empty:hidden" /> : null;
  return { widget, getToken, reset, failed };
}

/** True when an error came from the CAPTCHA (it didn't load, or the check failed or timed out). */
export const isCaptchaError = (error: unknown) =>
  (error instanceof Error && error.message === "captcha")
  || (typeof error === "object" && error !== null && "code" in error && String((error as { code: unknown }).code).startsWith("captcha"));
