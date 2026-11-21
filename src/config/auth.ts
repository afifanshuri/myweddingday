// Keep in sync with Supabase Dashboard > Authentication > Providers > Email (password requirements).
export const PASSWORD_RULES = { minLength: 6, hint: "At least 6 characters." } as const;

/** Fixed messages the login page can show after a redirect. Unknown values are ignored. */
export const LOGIN_NOTICES = {
  "link-invalid": "That link is invalid or has expired. Sign in, or request a new password reset link.",
} as const;
export type LoginNotice = keyof typeof LOGIN_NOTICES;

export const loginNotice = (value: unknown): string | null =>
  typeof value === "string" && Object.hasOwn(LOGIN_NOTICES, value) ? LOGIN_NOTICES[value as LoginNotice] : null;
