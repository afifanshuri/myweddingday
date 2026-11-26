"use client";

import { useState, type FormEvent } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import AuthCard, { authInputClass } from "./AuthCard";
import { APIRequestPasswordReset } from "@/services/api/auth";
import { ROUTES } from "@/config/routes";
import { useT } from "@/i18n";

export default function ForgotPasswordForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const t = useT();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    setStatus("sending");
    try {
      const { error } = await APIRequestPasswordReset(email);
      // Rate limits are the only error worth showing; anything else gets the same reply as success.
      setStatus(error?.status === 429 ? "error" : "sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <AuthCard title={t.auth.resetTitle} intro={t.auth.resetIntro}>
      {status === "sent" ? (
        <p role="status" className="text-sm text-stone-700">
          {t.auth.resetSent}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm text-stone-700">
            {t.auth.email}
            <input type="email" name="email" autoComplete="email" required disabled={status === "sending"} className={authInputClass} />
          </label>
          {status === "error" && <p role="alert" className="text-sm text-stone-600">{t.auth.sendFailed}</p>}
          <MainButton type="submit" disabled={status === "sending"} className="w-full">
            {status === "sending" ? t.auth.sending : t.auth.sendLink}
          </MainButton>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-stone-600">
        <MainButton href={ROUTES.login} variant="link" size="none">{t.auth.backToSignIn}</MainButton>
      </p>
    </AuthCard>
  );
}
