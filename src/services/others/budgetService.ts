import { SERVICE_ID } from "@/config/serviceCriteria";
import type { BasicPreferenceType, SelectedPackage } from "@/types/preferenceTypes";

export function getCostInSen(serviceId: number, unitPrice: number, guests: number): number | null {
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) return null;
  const quantity = serviceId === SERVICE_ID.CATERING ? guests : 1;
  if (!Number.isInteger(quantity) || quantity <= 0) return null;
  return Math.round(unitPrice * 100) * quantity;
}

export function getBudgetSummary(services: number[], preferences: BasicPreferenceType[], packages: SelectedPackage[], guests: number) {
  const plannedCosts = services.map((id) => getCostInSen(id,
    preferences.find((preference) => preference.serviceId === id)?.budget ?? 0, guests));
  const selections = services.flatMap((id) => {
    const pkg = packages.find((item) => item.serviceId === id);
    return pkg ? [{ ...pkg, costSen: getCostInSen(id, pkg.unitPrice, guests) }] : [];
  });
  const plannedSen = services.length && plannedCosts.every((cost) => cost !== null)
    ? plannedCosts.reduce<number>((sum, cost) => sum + cost!, 0) : null;
  const selectedSen = selections.every((pkg) => pkg.costSen !== null)
    ? selections.reduce((sum, pkg) => sum + pkg.costSen!, 0) : null;
  return { selections, plannedSen, selectedSen,
    remainingSen: plannedSen !== null && selectedSen !== null ? plannedSen - selectedSen : null };
}
