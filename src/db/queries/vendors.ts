import { db } from "@/db";
import { packagesTable, vendorsTable } from "../schema";
import { and, desc, eq, getColumns, lte, or, sql, type SQL } from "drizzle-orm";
import { VendorMatchDTOType } from "@/types/dtoTypes";
import { clearHiddenCriteria, SERVICE_CRITERIA } from "@/config/serviceCriteria";

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
      const preferredConditions: SQL[] = [];
      const conditions = [
        eq(vendorsTable.serviceId, preference.serviceId),
        lte(packagesTable.price, preference.budget),
        sql`${vendorsTable.locationId} && ARRAY[${sql.join(preference.location, sql`, `)}]::integer[]`,
      ];

      // Build JSONB filter conditions from criteria
      if (preference.criteria) {
        const fields = SERVICE_CRITERIA[preference.serviceId] ?? [];
        const criteria = clearHiddenCriteria(fields, preference.criteria);
        for (const [key, value] of Object.entries(criteria)) {
          const field = fields.find((candidate) => candidate.key === key);
          if (!field ||
              ["text", "date", "time"].includes(field.type)) continue;
          const priorities = criteria._priorities;
          const preferred = priorities && typeof priorities === "object" &&
            !Array.isArray(priorities) &&
            (priorities as Record<string, unknown>)[key] === "preferred";
          const addCriterion = (condition: SQL) => {
            if (preferred) preferredConditions.push(condition);
            else conditions.push(condition);
          };
          if (value === true || value === false) {
            addCriterion(
              sql`(${packagesTable.filters}->>${key})::boolean = ${value}`,
            );
          } else if (typeof value === "number" && Number.isFinite(value)) {
            const numericValue = sql`CASE WHEN jsonb_typeof(${packagesTable.filters}->${key}) = 'number'
              THEN (${packagesTable.filters}->>${key})::numeric END`;
            addCriterion(field.comparison === "gte"
              ? sql`${numericValue} >= ${value}`
              : field.comparison === "lte"
                ? sql`${numericValue} <= ${value}`
                : sql`${numericValue} = ${value}`);
          } else if (typeof value === "string" && value !== "") {
            addCriterion(
              sql`${packagesTable.filters}->>${key} = ${value}`,
            );
          } else if (Array.isArray(value) && value.length > 0) {
            const orConditions = value.map((v: string) =>
              sql`(${packagesTable.filters}->${key}) @> ${JSON.stringify([v])}::jsonb`,
            );
            addCriterion(or(...orConditions)!);
          }
        }
      }

      const preferredScore = preferredConditions.length
        ? sql.join(preferredConditions.map((condition) => sql`CASE WHEN ${condition} THEN 1 ELSE 0 END`), sql` + `)
        : sql`0::integer`;
      const result = await db
        .select({
          vendor: getColumns(vendorsTable),
          package: getColumns(packagesTable),
        })
        .from(vendorsTable)
        .innerJoin(packagesTable, eq(vendorsTable.id, packagesTable.vendorId))
        .where(and(...conditions))
        .orderBy(desc(preferredScore), packagesTable.price)
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
            { vendor: (typeof results)[0]["vendor"]; packages: (typeof results)[0]["package"][] }
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
