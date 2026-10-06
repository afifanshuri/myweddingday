import { db } from "@/db";
import { locationTable } from "../schema";
import { cacheLife, cacheTag } from "next/cache";

const getAllLocations = async () => {
  'use cache';
  cacheLife('hours');
  cacheTag('locations');
  return await db.select().from(locationTable);
};

export { getAllLocations };
