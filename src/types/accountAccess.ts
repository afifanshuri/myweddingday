export type AccountAccess = {
  userId: string | null;
  role: "user" | "admin" | null;
  paidUntil: string | null;
  isPaid: boolean;
  canViewVendorIdentity: boolean;
};

export const GUEST_ACCESS: AccountAccess = {
  userId: null, role: null, paidUntil: null, isPaid: false, canViewVendorIdentity: false,
};
