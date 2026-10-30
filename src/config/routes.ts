import type { AccountAccess } from "@/types/accountAccess";
import { canViewIdentity } from "@/services/others/accessRules";

export const ROUTES = {
  home: "/", login: "/login", dashboard: "/dashboard", weddingPlan: "/weddingplan",
  match: "/match", payment: "/payment", admin: "/admin", adminUsers: "/admin/users",
} as const;

export type AccessRequirement = "public" | "guestOnly" | "signedIn" | "paid" | "admin";
export const PAGE_ACCESS: Record<string, AccessRequirement> = {
  [ROUTES.home]: "public", [ROUTES.login]: "guestOnly", [ROUTES.match]: "public",
  [ROUTES.dashboard]: "signedIn", [ROUTES.weddingPlan]: "signedIn", [ROUTES.payment]: "signedIn",
  [ROUTES.admin]: "admin", [ROUTES.adminUsers]: "admin",
};
export const serviceCriteriaRoute = (id: number) => `${ROUTES.weddingPlan}/${id}`;
export const vendorMatchRoute = (id: number) => `${ROUTES.match}/${id}`;
// firstTimeLogin is a navigation preference, never an authorization decision.
export const getDefaultRoute = (access: AccountAccess, firstTimeLogin: unknown = false) =>
  access.role === "admin" ? ROUTES.admin
    : access.userId && firstTimeLogin === true ? ROUTES.weddingPlan : ROUTES.dashboard;

export function getRouteRequirement(pathname: string): AccessRequirement | null {
  if (Object.hasOwn(PAGE_ACCESS, pathname)) return PAGE_ACCESS[pathname];
  if (/^\/weddingplan\/[1-6]$/.test(pathname)) return "signedIn";
  if (/^\/match\/[1-9]\d*$/.test(pathname)) return "paid";
  return null;
}

/** Accept known local pages only; never trust a query parameter as a redirect URL. */
export function getSafeReturnPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048 || !value.startsWith("/") || value.startsWith("//") || /[\\\s\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value, "https://routing.invalid");
    if (url.origin !== "https://routing.invalid" || url.pathname.includes("%") || url.hash
      || url.pathname === ROUTES.home || url.pathname === ROUTES.login || !getRouteRequirement(url.pathname)) return null;
    // The only page query is the payment page's optional, non-nested return target.
    if (url.search) {
      if (url.pathname !== ROUTES.payment || [...url.searchParams.keys()].some((key) => key !== "returnTo")
        || url.searchParams.getAll("returnTo").length !== 1) return null;
      const target = getSafeReturnPath(url.searchParams.get("returnTo"));
      if (!target || target.includes("?") || new URL(target, url).pathname === ROUTES.payment) return null;
      return `${ROUTES.payment}?returnTo=${encodeURIComponent(target)}`;
    }
    return url.pathname;
  } catch { return null; }
}

export function canAccessRoute(access: AccountAccess, path: string) {
  const safe = getSafeReturnPath(path);
  if (!safe) return false;
  const requirement = getRouteRequirement(new URL(safe, "https://routing.invalid").pathname);
  if (requirement === "public") return true;
  if (!access.userId) return false;
  if (requirement === "admin") return access.role === "admin";
  if (requirement === "paid") return canViewIdentity(access);
  return requirement === "signedIn";
}

export function paymentRoute(returnTo: string = ROUTES.match) {
  const safe = getSafeReturnPath(returnTo);
  const target = safe && !safe.includes("?") && safe !== ROUTES.payment ? safe : ROUTES.match;
  return `${ROUTES.payment}?returnTo=${encodeURIComponent(target)}`;
}
