import { findVendorsByPreferences } from "@/db/queries/vendors";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, parseJson, readBody, validatePreferences } from "@/services/others/requestValidation";

export async function POST(data: NextRequest) {
  try {
    console.log("in POST");
    const body = await readBody(data, 64 * 1024);
    const preferencesList = validatePreferences(parseJson(await body.text()));
    const result = await findVendorsByPreferences(preferencesList);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Failed to retrieve vendors");
  }
}
