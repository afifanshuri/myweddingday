"use client";
import MainButton from "@/components/commonComponents/MainButton";
import AuthCard, { authInputClass } from "@/components/authComponents/AuthCard";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { APICreateAuthAccount, APICreateAuthSession } from "@/services/api/auth";
import { APIResolveLoginDestination } from "@/services/api/account";
import { PASSWORD_RULES, loginNotice } from "@/config/auth";
import { ROUTES } from "@/config/routes";
import { useT } from "@/i18n";
import { isCaptchaError, useCaptcha } from "@/components/authComponents/useCaptcha";

export default function LoginForm() {
  const params = useSearchParams();
  // ?mode=signup opens the sign-up form (from "Create a free account" links).
  const [isRegistering, setIsRegistering] = useState(params.get("mode") === "signup");
  const t = useT();
  // Only fixed, allow-listed notices are shown (by key, in the chosen language); the query value is never rendered.
  const noticeParam = params.get("notice");
  const [notice, setNotice] = useState(loginNotice(noticeParam) ? noticeParam : null);
  const [message, setMessage] = useState("");
  // After sign-up without a session: "check your email", plus a way in for an email that was already registered.
  const [confirmSent, setConfirmSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routingPending, setRoutingPending] = useState(false);
  const captcha = useCaptcha();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setIsSubmitting(true);
    setMessage("");
    setConfirmSent(false);
    setNotice(null);
    try {
      if (!routingPending) {
        const captchaToken = await captcha.getToken();
        const { data, error } = isRegistering
          ? await APICreateAuthAccount(email, password, captchaToken)
          : await APICreateAuthSession(email, password, captchaToken);
        captcha.reset();
        if (error) {
          setMessage(isCaptchaError(error) ? t.auth.captchaFailed : isRegistering ? t.auth.signUpFailed : t.auth.signInFailed);
          return;
        }
        if (!data.session) {
          setConfirmSent(true);
          return;
        }
        setRoutingPending(true);
      }
      const { destination } = await APIResolveLoginDestination();
      window.location.replace(destination);
    } catch (error) {
      captcha.reset();
      setMessage(isCaptchaError(error) ? t.auth.captchaFailed : t.auth.connectFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title={isRegistering ? t.auth.createAccount : t.auth.welcomeBack} intro={isRegistering ? t.auth.signUpIntro : t.auth.signInIntro}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm text-stone-700">
          {t.auth.email}
          <input type="email" name="email" autoComplete="email" required disabled={isSubmitting || routingPending} className={authInputClass} />
        </label>
        <label className="block text-sm text-stone-700">
          <span className="flex items-baseline justify-between">
            {t.auth.password}
            {!isRegistering && <MainButton href={ROUTES.forgotPassword} variant="link" size="none" className="text-xs">{t.auth.forgot}</MainButton>}
          </span>
          <input type="password" name="password" autoComplete={isRegistering ? "new-password" : "current-password"}
            minLength={PASSWORD_RULES.minLength} required disabled={isSubmitting || routingPending}
            aria-describedby={isRegistering ? "password-rules" : undefined} className={authInputClass} />
          {isRegistering && <span id="password-rules" className="mt-1.5 block text-xs text-stone-500">{t.passwordForm.hint}</span>}
        </label>

        {(message || notice) && <p role="status" className="text-sm text-stone-600">{message || (notice && t.auth.notices[notice])}</p>}
        {confirmSent && <div role="status" className="space-y-2 rounded-xl border border-(--tertiary) bg-(--secondary)/50 p-4 text-sm text-stone-700">
          <p className="font-medium">{t.auth.confirmEmail}</p>
          <p className="text-stone-600">{t.auth.confirmEmailExisting}{" "}
            <MainButton variant="link" size="none" type="button" onClick={() => { setIsRegistering(false); setConfirmSent(false); }}>{t.auth.signIn}</MainButton>
            {" · "}
            <MainButton href={ROUTES.forgotPassword} variant="link" size="none">{t.auth.resetInstead}</MainButton>
          </p>
        </div>}

        {captcha.widget}
        <MainButton type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? t.auth.wait : routingPending ? t.auth.continueSignIn : isRegistering ? t.auth.createAccount : t.auth.signIn}
        </MainButton>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        {isRegistering ? t.auth.haveAccount : t.auth.newHere}{" "}
        <MainButton variant="link" size="none" type="button" disabled={isSubmitting || routingPending}
          onClick={() => { setIsRegistering(!isRegistering); setMessage(""); setConfirmSent(false); setNotice(null); }}>
          {isRegistering ? t.auth.signIn : t.auth.createAnAccount}
        </MainButton>
      </p>
    </AuthCard>
  );
}
