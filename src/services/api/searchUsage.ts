import type { SearchUsage } from "@/types/search";

export async function APIGetSearchUsage(signal?: AbortSignal): Promise<SearchUsage> {
  const response = await fetch("/api/account/search-usage", { cache: "no-store", signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Unable to load search allowance");
  return data;
}
