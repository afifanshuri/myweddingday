import { Suspense } from "react";
import { notFound } from "next/navigation";
import ServiceCriteriaPage from "@/components/weddingDetailComponents/ServiceCriteriaPage";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { serviceCriteriaRoute } from "@/config/routes";
import { SERVICE_CRITERIA } from "@/config/serviceCriteria";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

// Signed-in only, so there is no signed-out shell to validate as an instant navigation (see the account layout).
export const instant = false;

type Props = { params: Promise<{ serviceId: string }> };
async function CriteriaContent({ params }: Props) {
  const { serviceId } = await params;
  if (!/^[1-6]$/.test(serviceId) || !Object.hasOwn(SERVICE_CRITERIA, Number(serviceId))) notFound();
  await requireRouteAccess(serviceCriteriaRoute(Number(serviceId)));
  return <ServiceCriteriaPage serviceId={Number(serviceId)} />;
}
export default function CriteriaPage(props: Props) {
  return <Suspense fallback={<LoadingScreen label="Checking account access…" />}><CriteriaContent {...props} /></Suspense>;
}
