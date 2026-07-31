import { db } from "@/db";
import { vendorsTable } from "../schema";
import { eq, inArray } from "drizzle-orm";
import { VendorType } from "@/types/dataTypes";

const getAllVendorsByServiceIdArray = async (serviceId: number[]) => {
  return await db
    .select()
    .from(vendorsTable)
    .where(inArray(vendorsTable.serviceId, serviceId));
};

const getVendorById = async (id: number) => {
  return await db.select().from(vendorsTable).where(eq(vendorsTable.id, id));
};

const insertVendor = async (data: VendorType) => {
  console.log("In the Vendor Query Method");
  try {
    const [vendor] = await db
      .insert(vendorsTable)
      .values({
        vendorName: data.vendorName,
        locationId: data.locationId,
        serviceId: data.serviceId,
        contact: data.contact,
        detail: data.detail,
        rating: data.rating,
      })
      .returning({ id: vendorsTable.id, vendorName: vendorsTable.vendorName });

    return vendor;
  } catch (e) {
    console.error(e);
  }
};

const findVendorsByEmbeddings = async (data: )

export { getAllVendorsByServiceIdArray, getVendorById, insertVendor };
