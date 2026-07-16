import { SERVICE_ID } from "@/constants/commonConstants";
import {
  GiAmpleDress,
  GiFamilyHouse,
  GiForkKnifeSpoon,
  GiLipstick,
  GiPhotoCamera,
  GiSofa,
} from "react-icons/gi";

export default function ServiceTitleSection({
  currentServiceId,
  className = " ",
}: {
  currentServiceId: number;
  className: string;
}) {
  const onPopulateServiceTitlePage = (id: number) => {
    switch (id) {
      case SERVICE_ID.VENUE:
        return "Venue";
      case SERVICE_ID.PELAMIN:
        return "Pelamin";
      case SERVICE_ID.CATERING:
        return "Caterings";
      case SERVICE_ID.PHOTOGRAPHER:
        return "Photographers";
      case SERVICE_ID.MUA:
        return "Makeup Artists";
      case SERVICE_ID.CLOTHING:
        return "Clothings";
      default:
        return "Title";
    }
  };
  const retrieveServiceIcon = (id: number) => {
    switch (id) {
      case SERVICE_ID.VENUE:
        return <GiFamilyHouse className="text-[50px]" />;
      case SERVICE_ID.PELAMIN:
        return <GiSofa className="text-[50px]" />;
      case SERVICE_ID.CATERING:
        return <GiForkKnifeSpoon className="text-[50px]" />;
      case SERVICE_ID.PHOTOGRAPHER:
        return <GiPhotoCamera className="text-[50px]" />;
      case SERVICE_ID.MUA:
        return <GiLipstick className="text-[50px]" />;
      case SERVICE_ID.CLOTHING:
        return <GiAmpleDress className="text-[50px]" />;
      default:
        throw new Error(`Unknown service id: ${id}`);
    }
  };

  return (
    <div className="flex flex-row gap-4 justify-items-center">
      {retrieveServiceIcon(currentServiceId)}
      <p className={`text-[30px] ${className}`}>
        {onPopulateServiceTitlePage(currentServiceId)}
      </p>
    </div>
  );
}
