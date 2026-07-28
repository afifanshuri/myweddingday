import { VendorType } from "@/types/dataTypes";
import Image from "next/image";

export default function VendorContainer({ vendor }: { vendor: VendorType }) {
  return (
    <div>
      <div>
        <p>{vendor.vendorName}</p>
      </div>
    </div>
  );
}
