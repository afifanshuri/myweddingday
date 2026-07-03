import { getAllVendorsByServiceIdArray } from "@/db/queries/vendors";

export async function GET({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAllVendorsByServiceIdArray([Number(id)]);
  return Response.json(result);
}
