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
  /** Vendors dropped because they no longer exist, for a notice. */
  removed: number;
  /** Shortlisted vendors that exist but aren't approved right now: kept on the shortlist and shown as unavailable. */
  unavailable: Set<number>;
};

export const useShortlistDetails = create<ShortlistDetails>(() => ({ owner: null, vendors: new Map(), loading: false, failed: false, removed: 0, unavailable: new Set() }));

let inflight: { owner: string; key: string } | null = null;

/**
 * Loads details for the given shortlisted vendors into the shared map: only those not loaded yet, or older than
 * SHORTLIST_FRESH_MS (refreshed in the background while the old details stay on screen). `force` reloads all.
 * Vendors that no longer exist are removed from the shortlist; vendors not approved right now are kept and marked unavailable.
 */
export async function loadShortlistDetails(owner: string, vendorIds: number[], force = false) {
  const store = useShortlistDetails;
  if (store.getState().owner !== owner) store.setState({ owner, vendors: new Map(), failed: false, removed: 0, unavailable: new Set() });
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
    const unavailable = new Set(store.getState().unavailable);
    result.vendors.forEach((match) => unavailable.delete(match.vendor.id));
    result.unavailable.forEach((id) => { next.delete(id); unavailable.add(id); });
    store.setState((state) => ({ vendors: next, failed: false, removed: state.removed + result.missing.length, unavailable }));
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

/**
 * Whether the shortlist panel is open, and which vendor is open inside it. Kept in memory only, never in the address,
 * so nothing in the browser's history (Back, Forward, a refresh) can open it: only the user can.
 *
 * Browser Back still closes it: opening adds a history entry with the same address, marked in its state (level 1 for
 * the panel, 2 for a vendor inside it). Going back to an entry with a lower level closes what's above it; an entry with
 * a higher level (reached with Forward) is ignored, so it never reopens by itself.
 */
export const useShortlistPanel = create<{ open: boolean; vendorId: number | null }>(() => ({ open: false, vendorId: null }));

const MARK = "shortlistPanel";
/** History entries the panel has added that are still current: 0 (none), 1 (panel) or 2 (panel and a vendor). */
let depth = 0;

function pushLevel(level: 1 | 2) {
  window.history.pushState({ ...(window.history.state ?? {}), [MARK]: level }, "", window.location.href);
  depth = level;
}

export function openShortlistPanel() {
  if (useShortlistPanel.getState().open) return;
  pushLevel(1);
  useShortlistPanel.setState({ open: true, vendorId: null });
}

export function closeShortlistPanel() {
  const added = depth;
  depth = 0;
  useShortlistPanel.setState({ open: false, vendorId: null });
  if (added) window.history.go(-added);
}

export function openShortlistVendor(vendorId: number) {
  if (!useShortlistPanel.getState().open) return;
  if (depth === 1) pushLevel(2);
  useShortlistPanel.setState({ vendorId });
}

export function closeShortlistVendor() {
  // Back through the entry the vendor added; the history listener then shows the list again.
  if (depth === 2) { window.history.back(); return; }
  useShortlistPanel.setState({ vendorId: null });
}

/** Browser Back (or Forward) moved through history: close whatever sits above the entry reached. */
export function onShortlistHistory(state: unknown) {
  const level = state && typeof state === "object" && MARK in state ? Number((state as Record<string, unknown>)[MARK]) || 0 : 0;
  if (level >= depth) return;
  depth = level;
  useShortlistPanel.setState(level === 0 ? { open: false, vendorId: null } : { vendorId: null });
}

/** Leaving the page (e.g. a link) closes the panel without touching history. */
export function resetShortlistPanel() {
  depth = 0;
  useShortlistPanel.setState({ open: false, vendorId: null });
}
