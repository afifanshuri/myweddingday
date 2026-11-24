import { GiAmpleDress, GiFamilyHouse, GiForkKnifeSpoon, GiLipstick, GiPhotoCamera, GiSofa } from "react-icons/gi";
import type { IconType } from "react-icons";
import { SERVICE_ID } from "@/config/serviceCriteria";

const SERVICE_ICONS: Record<number, IconType> = {
  [SERVICE_ID.VENUE]: GiFamilyHouse,
  [SERVICE_ID.PELAMIN]: GiSofa,
  [SERVICE_ID.CATERING]: GiForkKnifeSpoon,
  [SERVICE_ID.PHOTOGRAPHER]: GiPhotoCamera,
  [SERVICE_ID.CLOTHING]: GiAmpleDress,
  [SERVICE_ID.MUA]: GiLipstick,
};
export const serviceIcon = (serviceId: number): IconType => SERVICE_ICONS[serviceId] ?? GiFamilyHouse;
