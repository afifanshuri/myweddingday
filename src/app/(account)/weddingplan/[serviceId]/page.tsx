import { Suspense } from "react";
import { notFound } from "next/navigation";
import ServiceCriteriaPage from "@/components/weddingDetailComponents/ServiceCriteriaPage";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { serviceCriteriaRoute } from "@/config/routes";
import { SERVICE_CRITERIA } from "@/config/serviceCriteria";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

type Props = { params: Promise<{ serviceId: string }> };
async function CriteriaContent({ params }: Props) {
  const { serviceId } = await params;
  if (!/^[1-6]$/.test(serviceId) || !Object.hasOwn(SERVICE_CRITERIA, Number(serviceId))) notFound();
  await requireRouteAccess(serviceCriteriaRoute(Number(serviceId)));
  return <ServiceCriteriaPage />;
}
export default function CriteriaPage(props: Props) {
  return <Suspense fallback={<LoadingScreen label="Checking account access…" />}><CriteriaContent {...props} /></Suspense>;
}
