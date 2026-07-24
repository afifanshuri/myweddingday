import { db } from "@/db";
import { locationTable } from "../schema";

const getAllLocations = async () => {
  return await db.select().from(locationTable);
};

export { getAllLocations };
