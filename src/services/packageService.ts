import { PackageType, VendorType } from "@/types/dataTypes";
import { generateFilename } from "./utils";
import { saveImageToBucket } from "./supabaseService";
import { createPackageEmbedding } from "./aiService";
import { ASSET_PATH } from "@/constants/commonConstants";

const savePackageToDTO = async (vendor: VendorType, pkg: PackageType) => {
  console.log(pkg.file);
  const fileName = generateFilename(pkg.file);
  console.log("filename" + fileName);
  const filePath = await saveImageToBucket(
    ASSET_PATH.PACKAGE,
    pkg.file,
    fileName,
  );
  console.log("filepath" + filePath);
  const embed = await createPackageEmbedding(pkg, vendor);
  return {
    name: pkg.name,
    price: pkg.price,
    details: pkg.details,
    filePath: filePath,
    vendorName: vendor.vendorName,
    vendorId: vendor.id,
    embedding: embed,
    tags: pkg.tags,
  };
};

const savePackageListToDTO = async (
  vendor: VendorType,
  pkgList: PackageType[],
) => {
  console.log("Inside Save Package to DTO Method");
  const pkgDTOList = await Promise.all(
    pkgList.map((pkg) => savePackageToDTO(vendor, pkg)),
  );
  return pkgDTOList;
};

export { savePackageToDTO, savePackageListToDTO };
