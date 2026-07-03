import { VendorType } from "@/types/basicTypes";

export default function VendorContainer({ params }: { params: VendorType }) {
  return (
    <div>
      <p>{params.vendorName}</p>
      <div>{params.detail}</div>
    </div>
  );
}
