import "server-only";
import { redirect } from "next/navigation";
import { getAccountAccess } from "./accountAccessService";
import { ROUTES, getRouteRequirement, paymentRoute, type AccessRequirement } from "@/config/routes";
import { resolveLoginDestination } from "./loginRoutingService";

export async function requirePageAccess(requirement: AccessRequirement) {
  const access = await getAccountAccess();
  if (requirement === "public") return access;
  if (requirement === "guestOnly") {
    await redirectSignedInUser();
    return access;
  }
  if (!access.userId) redirect(ROUTES.login);
  if (requirement === "admin" && access.role !== "admin") redirect(ROUTES.dashboard);
  if (requirement === "paid" && !access.canViewVendorIdentity) redirect(paymentRoute());
  return access;
}

export async function requireRouteAccess(path: string) {
  const requirement = getRouteRequirement(path);
  if (!requirement || requirement === "guestOnly") throw new Error("Use an explicit page entry guard for this route");
  return requirePageAccess(requirement);
}

export async function redirectSignedInUser() {
  const destination = await resolveLoginDestination();
  if (destination) redirect(destination);
}
