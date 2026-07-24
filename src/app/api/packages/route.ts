import { insertAllToPackage } from "@/db/queries/packages";
import { savePackageListToDTO } from "@/services/packageService";
import { PackageType } from "@/types/basicTypes";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("Inside POST METHOD Packages");
  try {
    const data = await request.formData();
    const vendor = JSON.parse(data.get("vendor") as string);
    const packageList: PackageType[] = [];

    let index = 0;

    while (data.has(`package_${index}`)) {
      const pkg = JSON.parse(data.get(`package_${index}`) as string);
      const file = data.get(`file_${index}`) as File | null;

      packageList.push({
        ...pkg,
        file: file,
      });

      index++;
    }
    console.log(packageList);
    const pkgDTOList = await savePackageListToDTO(vendor, packageList);
    await insertAllToPackage(pkgDTOList);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error: "Failed to save packages",
      },
      {
        status: 500,
      },
    );
  }
}
