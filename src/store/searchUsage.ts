import { create } from "zustand";
import type { SearchUsage } from "@/types/search";
import type { AccountAccess } from "@/types/accountAccess";

/** The signed-in account's search allowance, loaded by SearchAllowance (in the account navigation) and shared. */
export const useSearchUsage = create<{ userId: string | null; usage: SearchUsage | null }>(() => ({ userId: null, usage: null }));

/**
 * True once a free account has used its one search: it can't search again or change preferences until it gets Plus.
 * False while unknown, for Plus and admins, and for guests (the server enforces the limit either way).
 */
export function useFreeSearchUsed(access: AccountAccess, checking: boolean) {
  const { userId, usage } = useSearchUsage();
  if (checking || !access.userId || access.role === "admin" || access.isPaid) return false;
  return userId === access.userId && usage?.limit !== null && usage?.remaining === 0;
}
