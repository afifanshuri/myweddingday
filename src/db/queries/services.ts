import { inArray } from "drizzle-orm";
import { servicesTable } from "../schema";
import { db } from "@/db";
import { cacheLife, cacheTag } from "next/cache";

const getAllServices = async () => {
  'use cache';
  cacheLife('hours');
  cacheTag('services');
  return await db.select().from(servicesTable);
};

const getServicesById = async (id: number[]) => {
  return await db
    .select()
    .from(servicesTable)
    .where(inArray(servicesTable.id, id));
};

export { getAllServices, getServicesById };
