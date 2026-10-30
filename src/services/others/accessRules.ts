import type { AccountAccess } from "@/types/accountAccess";
import { GUEST_ACCESS } from "@/types/accountAccess";

type AccessUser = { id: string; app_metadata: Record<string, unknown> };

function parsePassTimestamp(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value)) return NaN;
  const day = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== value.slice(0, 10)) return NaN;
  return Date.parse(value);
}

export function getAccessForUser(user: AccessUser | null, now = Date.now()): AccountAccess {
  if (!user) return { ...GUEST_ACCESS };
  const role = user.app_metadata.role === "admin" ? "admin" : "user";
  const value = user.app_metadata.paid_until;
  const date = parsePassTimestamp(value);
  const paidUntil = Number.isFinite(date) ? new Date(date).toISOString() : null;
  const isPaid = Number.isFinite(date) && date > now;
  return { userId: user.id, role, paidUntil, isPaid, canViewVendorIdentity: role === "admin" || isPaid };
}

export function canViewIdentity(access: AccountAccess, now = Date.now()) {
  return !!access.userId && (access.role === "admin" ||
    (access.isPaid && !!access.paidUntil && Date.parse(access.paidUntil) > now));
}
