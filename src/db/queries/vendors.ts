import { db } from "@/db";
import { packagesTable, vendorsTable } from "../schema";
import { and, eq, getColumns, lte, or, sql } from "drizzle-orm";
import { VendorMatchDTOType } from "@/types/dtoTypes";

const getAllVendorsByServiceIdArray = async (serviceId: number[]) => {
  return await db
    .select()
    .from(vendorsTable)
    .where(
      serviceId.length === 1
        ? eq(vendorsTable.serviceId, serviceId[0])
        : or(...serviceId.map((id) => eq(vendorsTable.serviceId, id))),
    );
};

const getVendorById = async (id: number) => {
  return await db.select().from(vendorsTable).where(eq(vendorsTable.id, id));
};

const insertVendor = async (data: {
  vendorName: string;
  locationId: number[];
  serviceId: number;
  contact: string | null;
  detail: string | null;
  rating: number | null;
}) => {
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
      const conditions = [
        eq(vendorsTable.serviceId, preference.serviceId),
        lte(packagesTable.price, preference.budget),
        sql`${vendorsTable.locationId} && ARRAY[${sql.join(preference.location, sql`, `)}]::integer[]`,
      ];

      // Build JSONB filter conditions from criteria
      if (preference.criteria) {
        for (const [key, value] of Object.entries(preference.criteria)) {
          if (value === true || value === false) {
            conditions.push(
              sql`(${packagesTable.filters}->>${key})::boolean = ${value}`,
            );
          } else if (typeof value === "string" && value !== "") {
            conditions.push(
              sql`${packagesTable.filters}->>${key} = ${value}`,
            );
          } else if (Array.isArray(value) && value.length > 0) {
            const orConditions = value.map((v: string) =>
              sql`${packagesTable.filters}->>${key} = ${v}`,
            );
            conditions.push(or(...orConditions)!);
          }
        }
      }

      const result = await db
        .select({
          vendor: getColumns(vendorsTable),
          package: getColumns(packagesTable),
        })
        .from(vendorsTable)
        .innerJoin(packagesTable, eq(vendorsTable.id, packagesTable.vendorId))
        .where(and(...conditions))
        .orderBy(packagesTable.price)
        .limit(5);

      results.push(...result);
    }

    const array = Array.from(
      results
        .reduce(
          (acc, item) => {
            if (!acc.has(item.vendor.id)) {
              acc.set(item.vendor.id, { vendor: item.vendor, packages: [] });
            }
            acc.get(item.vendor.id)?.packages.push(item.package);
            return acc;
          },
          new Map<
            number,
            { vendor: (typeof results)[0]["vendor"]; packages: any[] }
          >(),
        )
        .values(),
    );
    return array;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export {
  getAllVendorsByServiceIdArray,
  getVendorById,
  insertVendor,
  findVendorsByPreferences,
};
