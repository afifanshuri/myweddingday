import { db } from "@/db";
import { vendorsTable } from "../schema";
import { inArray } from "drizzle-orm";

const getAllVendorsByServiceIdArray = async (serviceId: number[]) => {
  return await db
    .select()
    .from(vendorsTable)
    .where(inArray(vendorsTable.serviceId, serviceId));
};

export { getAllVendorsByServiceIdArray };
