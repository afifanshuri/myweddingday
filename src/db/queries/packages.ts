import { db } from "@/db";
import { packagesTable } from "../schema";
import { PakcageDTOType } from "@/types/dtoTypes";

const insertPackage = async (packageDTO: PakcageDTOType) => {
  return await db.insert(packagesTable).values({
    packageName: packageDTO.name,
    price: packageDTO.price,
    details: packageDTO.details,
    vendorId: packageDTO.vendorId,
    filePath: packageDTO.filePath,
    filters: packageDTO.filters ?? {},
  });
};

const insertAllToPackage = async (packageDTOList: PakcageDTOType[]) => {
  return await db.insert(packagesTable).values(
    packageDTOList.map((packageDTO) => ({
      packageName: packageDTO.name,
      price: packageDTO.price,
      details: packageDTO.details,
      vendorId: packageDTO.vendorId,
      filePath: packageDTO.filePath,
      filters: packageDTO.filters ?? {},
    })),
  );
};

export { insertPackage, insertAllToPackage };
