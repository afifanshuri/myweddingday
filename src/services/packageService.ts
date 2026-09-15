import { PackageType, VendorType } from "@/types/dataTypes";
import { generateFilename } from "./utils";
import { saveImageToBucket } from "./supabaseService";
import { ASSET_PATH } from "@/config/serviceCriteria";

const savePackageToDTO = async (vendor: VendorType, pkg: PackageType) => {
  const fileName = generateFilename(pkg.file);
  const filePath = await saveImageToBucket(
    ASSET_PATH.PACKAGE,
    pkg.file,
    fileName,
  );
  return {
    name: pkg.name,
    price: pkg.price,
    details: pkg.details,
    filePath: filePath,
    vendorName: vendor.vendorName,
    vendorId: vendor.id,
    filters: pkg.filters ?? {},
    tags: pkg.tags,
  };
};

const savePackageListToDTO = async (
  vendor: VendorType,
  pkgList: PackageType[],
) => {
  const pkgDTOList = await Promise.all(
    pkgList.map((pkg) => savePackageToDTO(vendor, pkg)),
  );
  return pkgDTOList;
};

export { savePackageToDTO, savePackageListToDTO };
