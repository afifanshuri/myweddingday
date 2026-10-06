import type { LocationType } from "@/types/dataTypes";

export async function APIGetLocationsAll(): Promise<LocationType[]> {
  const response = await fetch("/api/locations");
  return response.json();
}
