"use client";

import { useState, type FormEvent } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import { authInputClass } from "./AuthCard";
import { APIChangePassword } from "@/services/api/plan";
import { PASSWORD_RULES } from "@/config/auth";
import { useT } from "@/i18n";

/** A signed-in user changes their password after confirming the current one. They stay signed in. */
export default function ChangePasswordForm() {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const t = useT();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const current = String(form.get("current") ?? "");
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) { setMessage({ text: t.passwordForm.mismatch, ok: false }); return; }
    setBusy(true);
    setMessage(null);
    try {
      await APIChangePassword(current, password);
      formElement.reset();
      setMessage({ text: t.passwordForm.updated, ok: true });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : t.passwordForm.connectFailed, ok: false });
    } finally { setBusy(false); }
  }

  return <form onSubmit={handleSubmit} className="max-w-sm space-y-5">
    <p className="text-xs text-foreground/60">{t.passwordForm.hint}</p>
    <label className="block text-sm text-stone-700">
      {t.passwordForm.current}
      <input type="password" name="current" autoComplete="current-password" required disabled={busy} className={authInputClass} />
    </label>
    <label className="block text-sm text-stone-700">
      {t.passwordForm.next}
      <input type="password" name="password" autoComplete="new-password" minLength={PASSWORD_RULES.minLength} required disabled={busy} className={authInputClass} />
    </label>
    <label className="block text-sm text-stone-700">
      {t.passwordForm.confirm}
      <input type="password" name="confirm" autoComplete="new-password" minLength={PASSWORD_RULES.minLength} required disabled={busy} className={authInputClass} />
    </label>
    {message && <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-(--positive-tertiary)" : "text-red-700"}`}>{t.errors[message.text] ?? message.text}</p>}
    <MainButton type="submit" disabled={busy}>{busy ? t.passwordForm.wait : t.passwordForm.update}</MainButton>
    <p className="text-xs text-foreground/60">{t.passwordForm.forgot}</p>
  </form>;
}
