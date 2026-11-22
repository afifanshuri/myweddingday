// Keep in sync with Supabase Dashboard > Authentication > Providers > Email (password requirements).
export const PASSWORD_RULES = { minLength: 6, hint: "At least 6 characters." } as const;

/**
 * Set by /auth/confirm when a password-reset link signs the user in. Holds that session's id, so
 * /reset-password can tell a reset (sign out afterwards) from a signed-in password change (stay signed in).
 * A later normal sign-in has a different session id, so a leftover cookie has no effect.
 */
export const RECOVERY_SESSION_COOKIE = "recovery_session";

/** Fixed messages the login page can show after a redirect. Unknown values are ignored. */
export const LOGIN_NOTICES = {
  "link-invalid": "That link is invalid or has expired. Sign in, or request a new password reset link.",
  "password-updated": "Your password has been updated. Sign in with your new password.",
} as const;
export type LoginNotice = keyof typeof LOGIN_NOTICES;

export const loginNotice = (value: unknown): string | null =>
  typeof value === "string" && Object.hasOwn(LOGIN_NOTICES, value) ? LOGIN_NOTICES[value as LoginNotice] : null;
