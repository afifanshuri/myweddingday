import { VendorType } from "@/types/basicTypes";
import Image from "next/image";

export default function VendorContainer({ vendor }: { vendor: VendorType }) {
  return (
    <div>
      <Image></Image>
      <div>
        <p>{vendor.vendorName}</p>
      </div>
    </div>
  );
}
