import { getAllLocations } from "@/db/queries/locations";

const retrieveAllLocations = async () => {
  return await getAllLocations();
};

export { retrieveAllLocations };
