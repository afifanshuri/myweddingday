"use client";

import { useState, type FormEvent } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import { authInputClass } from "./AuthCard";
import { APIChangePassword } from "@/services/api/plan";
import { PASSWORD_RULES } from "@/config/auth";

/** A signed-in user changes their password after confirming the current one. They stay signed in. */
export default function ChangePasswordForm() {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const current = String(form.get("current") ?? "");
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) { setMessage({ text: "The new passwords don't match.", ok: false }); return; }
    setBusy(true);
    setMessage(null);
    try {
      await APIChangePassword(current, password);
      formElement.reset();
      setMessage({ text: "Your password has been updated.", ok: true });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Unable to connect. Please try again.", ok: false });
    } finally { setBusy(false); }
  }

  return <form onSubmit={handleSubmit} className="mt-4 max-w-sm space-y-5">
    <p className="text-xs text-foreground/60">{PASSWORD_RULES.hint}</p>
    <label className="block text-sm text-stone-700">
      Current password
      <input type="password" name="current" autoComplete="current-password" required disabled={busy} className={authInputClass} />
    </label>
    <label className="block text-sm text-stone-700">
      New password
      <input type="password" name="password" autoComplete="new-password" minLength={PASSWORD_RULES.minLength} required disabled={busy} className={authInputClass} />
    </label>
    <label className="block text-sm text-stone-700">
      Confirm new password
      <input type="password" name="confirm" autoComplete="new-password" minLength={PASSWORD_RULES.minLength} required disabled={busy} className={authInputClass} />
    </label>
    {message && <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-(--positive-tertiary)" : "text-red-700"}`}>{message.text}</p>}
    <MainButton type="submit" disabled={busy}>{busy ? "Please wait..." : "Update password"}</MainButton>
    <p className="text-xs text-foreground/60">Forgot your current password? Log out, then choose &ldquo;Forgot password&rdquo; on the sign-in page.</p>
  </form>;
}
