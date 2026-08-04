import { db } from "@/db";
import { packagesTable, vendorsTable } from "../schema";
import { and, eq, getColumns, gte, inArray, lte, or, sql } from "drizzle-orm";
import { VendorType } from "@/types/dataTypes";
import { VendorMatchDTOType } from "@/types/dtoTypes";

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

const findVendorsByPreferences = async (
  preferencesList: VendorMatchDTOType[],
) => {
  const results = [];
  try {
    for (const preference of preferencesList) {
      const result = await db
        .select({
          vendor: getColumns(vendorsTable),
          package: getColumns(packagesTable),
        })
        .from(vendorsTable)
        .innerJoin(packagesTable, eq(vendorsTable.id, packagesTable.vendorId))
        .where(
          and(
            eq(vendorsTable.serviceId, preference.serviceId),
            lte(packagesTable.price, preference.budget),
            sql`${vendorsTable.locationId} && ARRAY[${sql.join(preference.location, sql`, `)}]::integer[]`,
          ),
        )
        .orderBy(sql`${packagesTable.embedding} <=> ${preference.embedding}`)
        .limit(5);

      results.push(...result);
    }
    const array = Array.from(
      results
        .reduce((acc, item) => {
          if (!acc.has(item.vendor.id)) {
            acc.set(item.vendor.id, { vendor: item.vendor, packages: [] });
          }
          acc.get(item.vendor.id)?.packages.push(item.package);
          return acc;
        }, new Map())
        .values(),
    );
    console.log("Vendors retrieved from DB:", array);
    return array;
  } catch (e) {
    console.error(e);
  }
};

export {
  getAllVendorsByServiceIdArray,
  getVendorById,
  insertVendor,
  findVendorsByPreferences,
};
