"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/**
 * An ID kept in the address (for example `?vendor=48`), so opening something adds a browser history entry:
 * the browser's Back button closes it again, and a refresh keeps it open.
 * - `open(id)` adds the entry and scrolls to the top; `close()` goes back to the entry it came from (or, if the page
 *   was opened with the ID already in the address, removes it without leaving the page).
 * - When it closes, the scroll position from before it opened is restored.
 */
export function useHistoryParam(name: string) {
  const raw = useSearchParams().get(name);
  const value = raw && /^[1-9]\d{0,9}$/.test(raw) && Number(raw) <= 2147483647 ? Number(raw) : null;
  const pushed = useRef(false);
  const scrollBefore = useRef<number | null>(null);

  const open = useCallback((id: number) => {
    scrollBefore.current = window.scrollY;
    const url = new URL(window.location.href);
    url.searchParams.set(name, String(id));
    window.history.pushState(null, "", url);
    pushed.current = true;
    window.scrollTo({ top: 0 });
  }, [name]);

  const close = useCallback(() => {
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
      return;
    }
    const url = new URL(window.location.href);
    if (!url.searchParams.has(name)) return;
    url.searchParams.delete(name);
    window.history.replaceState(null, "", url);
  }, [name]);

  useEffect(() => {
    if (value !== null) return;
    // Closed (by close() or the browser's Back button): the next close can't go back to an entry we added.
    pushed.current = false;
    const y = scrollBefore.current;
    scrollBefore.current = null;
    if (y !== null) requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, [value]);

  return [value, open, close] as const;
}
