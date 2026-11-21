"use client";

import { useState, type FormEvent } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import AuthCard, { authInputClass } from "./AuthCard";
import { APIRequestPasswordReset } from "@/services/api/auth";
import { ROUTES } from "@/config/routes";

export default function ForgotPasswordForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

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
    <AuthCard title="Reset password" intro="Enter your account email and we'll send you a link to choose a new password.">
      {status === "sent" ? (
        <p role="status" className="text-sm text-stone-700">
          If an account exists for that email, a reset link is on its way. Open it in this browser to continue.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm text-stone-700">
            Email
            <input type="email" name="email" autoComplete="email" required disabled={status === "sending"} className={authInputClass} />
          </label>
          {status === "error" && <p role="alert" className="text-sm text-stone-600">Unable to send the link right now. Please wait a minute and try again.</p>}
          <MainButton type="submit" disabled={status === "sending"} className="w-full">
            {status === "sending" ? "Sending..." : "Send reset link"}
          </MainButton>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-stone-600">
        <MainButton href={ROUTES.login} variant="link" size="none">Back to sign in</MainButton>
      </p>
    </AuthCard>
  );
}
