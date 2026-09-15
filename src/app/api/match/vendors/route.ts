import { findVendorsByPreferences } from "@/db/queries/vendors";
import { NextRequest, NextResponse } from "next/server";

export async function POST(data: NextRequest) {
  try {
    const preferencesList = await data.json();
    const result = await findVendorsByPreferences(preferencesList);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error occurred while retrieving vendors:", error);
    return NextResponse.json(
      { error: "Failed to retrieve vendors" },
      { status: 500 },
    );
  }
}