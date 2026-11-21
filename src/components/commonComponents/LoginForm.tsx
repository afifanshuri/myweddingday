"use client";
import MainButton from "@/components/commonComponents/MainButton";
import AuthCard, { authInputClass } from "@/components/authComponents/AuthCard";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { APICreateAuthAccount, APICreateAuthSession } from "@/services/api/auth";
import { APIResolveLoginDestination } from "@/services/api/account";
import { PASSWORD_RULES, loginNotice } from "@/config/auth";
import { ROUTES } from "@/config/routes";

export default function LoginForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  // Only fixed, allow-listed notices are shown; the query value itself is never rendered.
  const notice = loginNotice(useSearchParams().get("notice"));
  const [message, setMessage] = useState(notice ?? "");
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
    try {
      if (!routingPending) {
        const { data, error } = isRegistering
          ? await APICreateAuthAccount(email, password)
          : await APICreateAuthSession(email, password);
        if (error) {
          setMessage(isRegistering ? "Unable to create account. Check your details and try again." : "Unable to sign in. Check your email and password.");
          return;
        }
        if (!data.session) {
          setMessage("Check your email to confirm your account, then sign in.");
          return;
        }
        setRoutingPending(true);
      }
      const { destination } = await APIResolveLoginDestination();
      window.location.replace(destination);
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title={isRegistering ? "Create account" : "Welcome back"} intro={isRegistering ? "Sign up to get started." : "Sign in to continue."}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm text-stone-700">
          Email
          <input type="email" name="email" autoComplete="email" required disabled={isSubmitting || routingPending} className={authInputClass} />
        </label>
        <label className="block text-sm text-stone-700">
          <span className="flex items-baseline justify-between">
            Password
            {!isRegistering && <MainButton href={ROUTES.forgotPassword} variant="link" size="none" className="text-xs">Forgot password?</MainButton>}
          </span>
          <input type="password" name="password" autoComplete={isRegistering ? "new-password" : "current-password"}
            minLength={PASSWORD_RULES.minLength} required disabled={isSubmitting || routingPending}
            aria-describedby={isRegistering ? "password-rules" : undefined} className={authInputClass} />
          {isRegistering && <span id="password-rules" className="mt-1.5 block text-xs text-stone-500">{PASSWORD_RULES.hint}</span>}
        </label>

        {message && <p role="status" className="text-sm text-stone-600">{message}</p>}

        <MainButton type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Please wait..." : routingPending ? "Continue sign-in" : isRegistering ? "Create account" : "Sign in"}
        </MainButton>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        {isRegistering ? "Already have an account?" : "New here?"}{" "}
        <MainButton variant="link" size="none" type="button" disabled={isSubmitting || routingPending}
          onClick={() => { setIsRegistering(!isRegistering); setMessage(""); }}>
          {isRegistering ? "Sign in" : "Create an account"}
        </MainButton>
      </p>
    </AuthCard>
  );
}
