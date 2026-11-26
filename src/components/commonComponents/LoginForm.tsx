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

export default function LoginForm() {
  const params = useSearchParams();
  // ?mode=signup opens the sign-up form (from "Create a free account" links).
  const [isRegistering, setIsRegistering] = useState(params.get("mode") === "signup");
  const t = useT();
  // Only fixed, allow-listed notices are shown (by key, in the chosen language); the query value is never rendered.
  const noticeParam = params.get("notice");
  const [notice, setNotice] = useState(loginNotice(noticeParam) ? noticeParam : null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routingPending, setRoutingPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setIsSubmitting(true);
    setMessage("");
    setNotice(null);
    try {
      if (!routingPending) {
        const { data, error } = isRegistering
          ? await APICreateAuthAccount(email, password)
          : await APICreateAuthSession(email, password);
        if (error) {
          setMessage(isRegistering ? t.auth.signUpFailed : t.auth.signInFailed);
          return;
        }
        if (!data.session) {
          setMessage(t.auth.confirmEmail);
          return;
        }
        setRoutingPending(true);
      }
      const { destination } = await APIResolveLoginDestination();
      window.location.replace(destination);
    } catch {
      setMessage(t.auth.connectFailed);
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

        <MainButton type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? t.auth.wait : routingPending ? t.auth.continueSignIn : isRegistering ? t.auth.createAccount : t.auth.signIn}
        </MainButton>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        {isRegistering ? t.auth.haveAccount : t.auth.newHere}{" "}
        <MainButton variant="link" size="none" type="button" disabled={isSubmitting || routingPending}
          onClick={() => { setIsRegistering(!isRegistering); setMessage(""); setNotice(null); }}>
          {isRegistering ? t.auth.signIn : t.auth.createAnAccount}
        </MainButton>
      </p>
    </AuthCard>
  );
}
