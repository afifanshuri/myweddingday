"use client";

import { useState, type FormEvent } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import AuthCard, { authInputClass } from "./AuthCard";
import { APIRequestPasswordReset } from "@/services/api/auth";
import { ROUTES } from "@/config/routes";
import { useT } from "@/i18n";
import { isCaptchaError, useCaptcha } from "./useCaptcha";

export default function ForgotPasswordForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "captcha">("idle");
  const captcha = useCaptcha();
  const t = useT();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    setStatus("sending");
    try {
      const { error } = await APIRequestPasswordReset(email, await captcha.getToken());
      captcha.reset();
      // Rate limits and a failed security check are the only errors worth showing; anything else gets the same reply as success.
      setStatus(isCaptchaError(error) ? "captcha" : error?.status === 429 ? "error" : "sent");
    } catch (error) {
      captcha.reset();
      setStatus(isCaptchaError(error) ? "captcha" : "error");
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
          {(status === "error" || status === "captcha") && <p role="alert" className="text-sm text-stone-600">{status === "captcha" ? t.auth.captchaFailed : t.auth.sendFailed}</p>}
          {captcha.widget}
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
