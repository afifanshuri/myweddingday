import { PackageType, VendorType } from "@/types/basicTypes";
import { GoogleGenAI } from "@google/genai";

async function createPackageEmbedding(pkg: PackageType, vendor: VendorType) {
  const ai = new GoogleGenAI({});
  const contents = `
  Vendor: ${vendor.vendorName}
  Description:
${pkg.details}
Package Name:
${pkg.name}
Price:
RM ${pkg.price}
Tags:
${pkg.tags.join(", ")}
  `;
  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: contents,
  });

  return response.embeddings?.[0]?.values;
}

export { createPackageEmbedding };
