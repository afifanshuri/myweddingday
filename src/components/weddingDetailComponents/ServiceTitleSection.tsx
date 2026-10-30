import { SERVICE_ID } from "@/config/serviceCriteria";
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
  serviceName,
  className = " ",
}: {
  currentServiceId: number;
  serviceName: string;
  className: string;
}) {
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
        {serviceName}
      </p>
    </div>
  );
}
