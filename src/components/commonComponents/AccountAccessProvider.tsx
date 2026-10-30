"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";
import { GUEST_ACCESS, type AccountAccess } from "@/types/accountAccess";
import { canViewIdentity } from "@/services/others/accessRules";
import { usePreferenceStore } from "@/store/preferenceStore";
import { APIGetAccountAccess } from "@/services/api/account";

type AccessState = { access: AccountAccess; checking: boolean; revision: number };
const Context = createContext<AccessState>({ access: GUEST_ACCESS, checking: true, revision: 0 });
export const useAccountAccess = () => useContext(Context);

export default function AccountAccessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccessState>({ access: GUEST_ACCESS, checking: true, revision: 0 });
  const accessRef = useRef(GUEST_ACCESS);
  useEffect(() => {
    let alive = true;
    let generation = 0;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    async function refresh(invalidate = true) {
      const current = ++generation;
      controller?.abort();
      controller = new AbortController();
      if (invalidate) {
        clearTimeout(expiryTimer);
        accessRef.current = GUEST_ACCESS;
        usePreferenceStore.getState().redactSelectedPackages();
        setState((previous) => ({ access: GUEST_ACCESS, checking: true, revision: previous.revision + 1 }));
      }
      try {
        const access = await APIGetAccountAccess(controller.signal);
        if (!alive || current !== generation) return;
        clearTimeout(expiryTimer);
        const changed = JSON.stringify(accessRef.current) !== JSON.stringify(access);
        accessRef.current = access;
        if (!invalidate && changed) usePreferenceStore.getState().redactSelectedPackages();
        setState((previous) => ({ ...previous, access, checking: false, revision: previous.revision + (!invalidate && changed ? 1 : 0) }));
        if (access.paidUntil && access.isPaid && access.role !== "admin") {
          expiryTimer = setTimeout(() => { void refresh(); }, Math.min(2147483647, Math.max(1, Date.parse(access.paidUntil) - Date.now())));
        }
      } catch {
        if (alive && current === generation) {
          clearTimeout(expiryTimer);
          accessRef.current = GUEST_ACCESS;
          usePreferenceStore.getState().redactSelectedPackages();
          setState((previous) => ({ access: GUEST_ACCESS, checking: false, revision: previous.revision + 1 }));
        }
      }
    }
    const onFocus = () => { if (document.visibilityState === "visible") void refresh(false); };
    const onPageHide = () => {
      generation++; controller?.abort(); clearTimeout(expiryTimer);
      accessRef.current = GUEST_ACCESS;
      usePreferenceStore.getState().redactSelectedPackages();
      setState((previous) => ({ access: GUEST_ACCESS, checking: true, revision: previous.revision + 1 }));
    };
    const subscription = createClient().auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      // Repeated sign-in/token events for the same account must not reset the page.
      const invalidate = event === "SIGNED_OUT" || (session?.user.id ?? null) !== accessRef.current.userId;
      queueMicrotask(() => { if (alive) void refresh(invalidate); });
    });
    void refresh();
    const interval = setInterval(() => { if (document.visibilityState === "visible") void refresh(false); }, 60000);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onFocus);
    // Store actions consult this current value; stale UI cannot add a package after expiry.
    usePreferenceStore.getState().setSelectionAccess(() => canViewIdentity(accessRef.current));
    return () => {
      alive = false; generation++; controller?.abort(); clearTimeout(expiryTimer); clearInterval(interval);
      subscription.data.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus); window.removeEventListener("pageshow", onFocus);
      window.removeEventListener("pagehide", onPageHide); document.removeEventListener("visibilitychange", onFocus);
      usePreferenceStore.getState().setSelectionAccess(() => false);
    };
  }, []);
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
