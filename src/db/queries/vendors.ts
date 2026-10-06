import { db } from "@/db";
import { packagesTable, vendorsTable } from "../schema";
import { and, desc, eq, getColumns, lte, or, sql, type SQL } from "drizzle-orm";
import { VendorMatchDTOType } from "@/types/dtoTypes";
import {
  clearHiddenCriteria,
  SERVICE_CRITERIA,
} from "@/config/serviceCriteria";

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

const findVendorsByPreferences = async (
  preferencesList: VendorMatchDTOType[],
) => {
  console.log("in findVendorsByPreferences");
  const results = [];
  for (const preference of preferencesList) {
    const requiredFields = new Set(preference.requiredFields ?? []);
    const preferredConditions: SQL[] = [];
    const conditions = [
      and(
        eq(vendorsTable.serviceId, preference.serviceId),
        lte(packagesTable.price, preference.budget),
        sql`${vendorsTable.locationId} && ARRAY[${sql.join(preference.location, sql`, `)}]::integer[]`,
      ),
    ];

    // Build JSONB filter conditions from criteria
    if (preference.criteria) {
      const fields = SERVICE_CRITERIA[preference.serviceId] ?? [];
      const criteria = clearHiddenCriteria(fields, preference.criteria);
      for (const [key, value] of Object.entries(criteria)) {
        const field = fields.find((candidate) => candidate.key === key);
        if (!field || ["text", "date", "time"].includes(field.type)) continue;
        const addCriterion = (condition: SQL) => {
          if (requiredFields.has(key)) conditions.push(condition);
          else preferredConditions.push(condition);
        };
        if (value === true || value === false) {
          addCriterion(
            sql`${packagesTable.filters}->${key} = ${JSON.stringify(value)}::jsonb`,
          );
        } else if (typeof value === "number" && Number.isFinite(value)) {
          const numericValue = sql`CASE WHEN jsonb_typeof(${packagesTable.filters}->${key}) = 'number'
            THEN (${packagesTable.filters}->>${key})::numeric END`;
          addCriterion(
            field.comparison === "gte"
              ? sql`${numericValue} >= ${value}`
              : field.comparison === "lte"
                ? sql`${numericValue} <= ${value}`
                : sql`${numericValue} = ${value}`,
          );
        } else if (typeof value === "string" && value !== "") {
          addCriterion(sql`${packagesTable.filters}->>${key} = ${value}`);
        } else if (Array.isArray(value) && value.length > 0) {
          const orConditions = value.map(
            (v: string) =>
              sql`(${packagesTable.filters}->${key}) @> ${JSON.stringify([v])}::jsonb`,
          );
          addCriterion(or(...orConditions)!);
        }
      }
    }
    const preferenceScore = preferredConditions.length
      ? sql<number>`${sql.join(
          preferredConditions.map(
            (condition) => sql`CASE WHEN ${condition} THEN 1 ELSE 0 END`,
          ),
          sql` + `,
        )}`
      : sql<number>`0::integer`;
    const result = await db
      .select({
        vendor: getColumns(vendorsTable),
        package: getColumns(packagesTable),
      })
      .from(vendorsTable)
      .innerJoin(packagesTable, eq(vendorsTable.id, packagesTable.vendorId))
      .where(and(...conditions))
      .orderBy(desc(preferenceScore), packagesTable.price)
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
      }, new Map<number, { vendor: (typeof results)[0]["vendor"]; packages: (typeof results)[0]["package"][] }>())
      .values(),
  );
  return array;
};

export {
  getAllVendorsByServiceIdArray,
  getVendorById,
  findVendorsByPreferences,
};
