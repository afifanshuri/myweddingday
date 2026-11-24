import { create } from "zustand";
import { APIGetShortlist } from "@/services/api/account";
import { usePreferenceStore } from "./preferenceStore";
import type { VendorMatchResult } from "@/types/dtoTypes";

/** How long loaded vendor details are used without checking the server again. */
export const SHORTLIST_FRESH_MS = 2 * 60 * 1000;

type Entry = { match: VendorMatchResult; at: number };
type ShortlistDetails = {
  /** Whose details these are: user and access revision, so upgrading or signing out never reuses them. */
  owner: string | null;
  /** Current details of shortlisted vendors, by vendor ID (the shortlist itself, IDs only, lives in the plan). */
  vendors: Map<number, Entry>;
  loading: boolean;
  failed: boolean;
  /** Vendors dropped because they're no longer available, for a notice. */
  removed: number;
};

export const useShortlistDetails = create<ShortlistDetails>(() => ({ owner: null, vendors: new Map(), loading: false, failed: false, removed: 0 }));

let inflight: { owner: string; key: string } | null = null;

/**
 * Loads details for the given shortlisted vendors into the shared map: only those not loaded yet, or older than
 * SHORTLIST_FRESH_MS (refreshed in the background while the old details stay on screen). `force` reloads all.
 * Vendors the server no longer returns are removed from the shortlist.
 */
export async function loadShortlistDetails(owner: string, vendorIds: number[], force = false) {
  const store = useShortlistDetails;
  if (store.getState().owner !== owner) store.setState({ owner, vendors: new Map(), failed: false, removed: 0 });
  const now = Date.now();
  const { vendors } = store.getState();
  const needed = vendorIds.filter((id) => force || !vendors.has(id) || now - vendors.get(id)!.at > SHORTLIST_FRESH_MS);
  if (!needed.length) return;
  const key = JSON.stringify(needed);
  if (inflight?.owner === owner && inflight.key === key) return;
  inflight = { owner, key };
  store.setState({ loading: true });
  try {
    const result = await APIGetShortlist(needed);
    if (store.getState().owner !== owner) return;
    const next = new Map(store.getState().vendors);
    const at = Date.now();
    result.vendors.forEach((match) => next.set(match.vendor.id, { match, at }));
    result.missing.forEach((id) => next.delete(id));
    store.setState((state) => ({ vendors: next, failed: false, removed: state.removed + result.missing.length }));
    if (result.missing.length) usePreferenceStore.getState().removeFromShortlist(result.missing);
  } catch {
    if (store.getState().owner === owner) store.setState({ failed: true });
  } finally {
    if (inflight?.key === key) inflight = null;
    if (store.getState().owner === owner) store.setState({ loading: false });
  }
}

export function dismissShortlistNotice() {
  useShortlistDetails.setState({ removed: 0 });
}

/** Opens the shortlist panel from anywhere (registered by the panel while it's mounted). */
let openPanel: (() => void) | null = null;
export function registerShortlistPanel(open: (() => void) | null) { openPanel = open; }
export function openShortlistPanel() { openPanel?.(); }
