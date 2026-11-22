"use client";

import { useState, type FormEvent } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import AuthCard, { authInputClass } from "./AuthCard";
import { APIEndAllAuthSessions, APIUpdatePassword } from "@/services/api/auth";
import { PASSWORD_RULES } from "@/config/auth";
import { ROUTES } from "@/config/routes";

/**
 * fromResetLink: the session came from a forgot-password link, so the user is signed out everywhere
 * and sent to sign in. Otherwise a signed-in user is changing their password and stays signed in.
 */
export default function ResetPasswordForm({ fromResetLink }: { fromResetLink: boolean }) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) {
      setMessage("The passwords don't match.");
      return;
    }
    setIsSubmitting(true);
    setMessage("");
    try {
      const { error } = await APIUpdatePassword(password);
      if (error) {
        setMessage(error.code === "same_password" ? "Choose a password different from your current one."
          : error.code === "weak_password" ? `That password is too weak. ${PASSWORD_RULES.hint}`
          : "Unable to update your password. Request a new reset link and try again.");
        return;
      }
      if (!fromResetLink) {
        formElement.reset();
        setMessage("Your password has been updated.");
        return;
      }
      // Sign out everywhere so the user signs in again with the new password,
      // and anyone else holding a session for this account loses it.
      await APIEndAllAuthSessions().catch(() => undefined);
      window.location.replace(`${ROUTES.login}?notice=password-updated`);
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title={fromResetLink ? "Choose a new password" : "Change your password"} intro={PASSWORD_RULES.hint}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm text-stone-700">
          New password
          <input type="password" name="password" autoComplete="new-password" minLength={PASSWORD_RULES.minLength} required disabled={isSubmitting} className={authInputClass} />
        </label>
        <label className="block text-sm text-stone-700">
          Confirm new password
          <input type="password" name="confirm" autoComplete="new-password" minLength={PASSWORD_RULES.minLength} required disabled={isSubmitting} className={authInputClass} />
        </label>
        {message && <p role="alert" className="text-sm text-stone-600">{message}</p>}
        <MainButton type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Please wait..." : "Update password"}
        </MainButton>
      </form>
    </AuthCard>
  );
}
