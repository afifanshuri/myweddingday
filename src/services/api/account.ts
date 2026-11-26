import type { AccountAccess } from "@/types/accountAccess";
import type { SelectedPackage } from "@/types/preferenceTypes";
import type { VendorMatchResult } from "@/types/dtoTypes";

export type AccountUser = AccountAccess & { email: string; createdAt: string };
export type AccessUpdate = { action: "setRole"; role: "user" | "admin" } | { action: "grantPass" | "revokePass" };

async function read<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Unable to load account");
  return data;
}
export async function APIGetAccountAccess(signal?: AbortSignal) {
  return read<AccountAccess>(await fetch("/api/account/access", { cache: "no-store", signal }));
}
export async function APIResolveLoginDestination() {
  return read<{ destination: string }>(await fetch("/api/account/login-destination", { method: "POST", cache: "no-store" }));
}
/** `locked`: chosen packages this account can't see now (kept in the plan, not shown). */
export async function APIGetSelectedPackages(ids: string, signal?: AbortSignal) {
  return read<{ packages: SelectedPackage[]; locked: number[]; unavailable: number[] }>(await fetch("/api/account/selections", { method: "POST", cache: "no-store", signal,
    headers: { "Content-Type": "application/json" }, body: ids }));
}
export async function APIGetUsersAll(page: number, signal?: AbortSignal) {
  return read<{ users: AccountUser[]; page: number; hasNext: boolean }>(await fetch(`/api/admin/users?page=${page}`, { cache: "no-store", signal }));
}
export async function APIUpdateUserAccess(userId: string, update: AccessUpdate) {
  return read<AccountUser>(await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "PATCH", cache: "no-store",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(update) }));
}
export async function APIGetShortlist(ids: number[], signal?: AbortSignal) {
  return read<{ vendors: VendorMatchResult[]; missing: number[]; unavailable: number[] }>(await fetch("/api/account/shortlist", { method: "POST", cache: "no-store", signal,
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(ids) }));
}
