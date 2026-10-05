import { createVendorWithPackages } from "./vendorSaveWorkflow";
import { db } from "@/db";
import { locationTable, servicesTable, vendorsTable, packagesTable } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { createPackageImageStorage } from "./packageImageService";
import { RequestError, validateVendor, validatePackages } from "./requestValidation";

type VendorInput = ReturnType<typeof validateVendor>;
type PackageInput = ReturnType<typeof validatePackages>[number];

export async function saveVendorRecords(vendor: VendorInput, packages: (PackageInput & { filePath?: string })[]) {
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(vendorsTable).values(vendor)
      .returning({ id: vendorsTable.id, vendorName: vendorsTable.vendorName });
    await tx.insert(packagesTable).values(packages.map((pkg) => ({ ...pkg, vendorId: created.id })));
    return created;
  });
}

export async function saveVendorSubmission(vendor: VendorInput, packages: PackageInput[], files: (File | null)[]) {
  const [services, locations] = await Promise.all([
    db.select({ id: servicesTable.id }).from(servicesTable).where(eq(servicesTable.id, vendor.serviceId)),
    db.select({ id: locationTable.id }).from(locationTable).where(inArray(locationTable.id, vendor.locationId)),
  ]);
  if (!services.length || locations.length !== vendor.locationId.length) {
    throw new RequestError("Selected service or location does not exist");
  }
  const storage = createPackageImageStorage();
  return createVendorWithPackages(vendor, packages, files, { ...storage, save: saveVendorRecords });
}
