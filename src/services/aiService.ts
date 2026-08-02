import { PackageType, VendorType } from "@/types/dataTypes";
import { BasicPreferenceType } from "@/types/preferenceTypes";
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

async function createPreferencesEmbedding(data: BasicPreferenceType) {
  try {
    const contents = `
Budget: RM ${data.budget}
Description: ${data.description}
Style: ${data.style.join(", ")}
    `.trim();

    const response = await ai.models.embedContent({
      model: "gemini-embedding-2", 
      contents: contents,
    });

    console.log("Embedding response:", response.embeddings?.[0]?.values);
    return response.embeddings?.[0]?.values ?? null ;
    
  } catch (error) {
    console.error("Failed to generate embedding for preferences:", error);
    return null; 
  }
}

export { createPackageEmbedding, createPreferencesEmbedding };