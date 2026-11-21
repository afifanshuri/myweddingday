import type { LocationType } from "@/types/dataTypes";

export async function APIGetLocationsAll(): Promise<LocationType[]> {
  const response = await fetch("/api/locations");
  if (!response.ok) throw new Error("Failed to load locations");
  return response.json();
}
