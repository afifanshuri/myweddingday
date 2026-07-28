import { db } from "@/db";
import { packagesTable } from "../schema";
import { PakcageDTOType } from "@/types/dtoTypes";
import { PackageType } from "@/types/dataTypes";

const insertPackage = async (packageDTO: PakcageDTOType) => {
  return await db.insert(packagesTable).values({
    packageName: packageDTO.name,
    price: packageDTO.price,
    details: packageDTO.details,
    vendorId: packageDTO.vendorId,
    filePath: packageDTO.filePath,
    embedding: packageDTO.embedding,
  });
};

const insertAllToPackage = async (packageDTOList: PakcageDTOType[]) => {
  console.log("Inside Package Query Method");
  return await db.insert(packagesTable).values(
    packageDTOList.map((packageDTO) => ({
      packageName: packageDTO.name,
      price: packageDTO.price,
      details: packageDTO.details,
      vendorId: packageDTO.vendorId,
      filePath: packageDTO.filePath,
      embedding: packageDTO.embedding,
    })),
  );
};

export { insertPackage, insertAllToPackage };
