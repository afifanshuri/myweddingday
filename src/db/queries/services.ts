import { inArray } from "drizzle-orm";
import { servicesTable } from "../schema";
import { db } from "@/db";

const getAllServices = async () => {
  return await db.select().from(servicesTable);
};

const getServicesById = async (id: number[]) => {
  return await db
    .select()
    .from(servicesTable)
    .where(inArray(servicesTable.id, id));
};

export { getAllServices, getServicesById };
