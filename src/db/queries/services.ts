import { servicesTable } from "../schema";
import { db } from "@/db";
import { cacheLife, cacheTag } from "next/cache";

const getAllServices = async () => {
  'use cache';
  cacheLife('hours');
  cacheTag('services');
  return await db.select().from(servicesTable);
};

export { getAllServices };
