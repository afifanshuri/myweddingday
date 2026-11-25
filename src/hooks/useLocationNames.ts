"use client";

import { useEffect, useState } from "react";
import { APIGetLocationsAll } from "@/services/api/locations";

// Loaded once per visit and shared (the list is public and rarely changes; the server caches it too).
let cached: Map<number, string> | null = null;
let loading: Promise<Map<number, string>> | null = null;

function loadNames() {
  loading ??= APIGetLocationsAll()
    .then((list) => (cached = new Map(list.map((location) => [location.id, location.locationName]))))
    .catch(() => { loading = null; return new Map<number, string>(); });
  return loading;
}

/** Names for location ids, in the order given; empty until loaded (and if loading fails). */
export function useLocationNames(ids: number[]): string[] {
  // Kept in state (not read from the module during render) so React knows when the names arrive.
  const [names, setNames] = useState<Map<number, string> | null>(cached);
  useEffect(() => {
    if (names) return;
    let active = true;
    void loadNames().then((loaded) => { if (active) setNames(loaded); });
    return () => { active = false; };
  }, [names]);
  return names ? ids.flatMap((id) => names.get(id) ?? []) : [];
}
