"use client";

import { useEffect } from "react";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useServiceStore } from "@/store/serviceStore";

export function useSelectedServices() {
  const ids = usePreferenceStore((state) => state.weddingDetails.services);
  const names = usePreferenceStore((state) => state.weddingDetails.serviceNames);
  const syncNames = usePreferenceStore((state) => state.syncServiceNames);
  const catalogue = useServiceStore((state) => state.service);
  const isLoaded = useServiceStore((state) => state.isLoaded);
  const initServices = useServiceStore((state) => state.initServices);

  useEffect(() => {
    if (catalogue.length) syncNames(catalogue);
    if (!isLoaded && ids.some((id) => !names[id] && !catalogue.some((service) => service.id === id))) {
      // Older preferences lack names. Load only the catalogue, never vendor matches.
      // A failed request retains saved labels/fallbacks and can retry on remount.
      void initServices().catch(() => {});
    }
  }, [ids, names, catalogue, isLoaded, initServices, syncNames]);

  return ids.map((id) => ({
    id,
    serviceName: catalogue.find((service) => service.id === id)?.serviceName ?? names[id] ?? `Service ${id}`,
  }));
}
