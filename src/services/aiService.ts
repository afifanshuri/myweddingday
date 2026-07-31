import { PackageType, VendorType } from "@/types/dataTypes";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function createPackageEmbedding(pkg: PackageType, vendor: VendorType) {
  try {
    const contents = `
Vendor: ${vendor.vendorName}
Description: ${pkg.details}
Package Name: ${pkg.name}
Price: RM ${pkg.price}
Tags: ${pkg.tags.join(", ")}
Locations: ${vendor.locationId.join(", ")}
    `.trim();

    const response = await ai.models.embedContent({
      model: "gemini-embedding-2", 
      contents: contents,
    });

    return response.embeddings?.[0]?.values ?? null ;
    
  } catch (error) {
    console.error("Failed to generate embedding for package:", pkg.name, error);
    return null; 
  }
}

export { createPackageEmbedding };