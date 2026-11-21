"use client";

import { useState, type FormEvent } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import AuthCard, { authInputClass } from "./AuthCard";
import { APIUpdatePassword } from "@/services/api/auth";
import { APIResolveLoginDestination } from "@/services/api/account";
import { PASSWORD_RULES } from "@/config/auth";

export default function ResetPasswordForm() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = new FormData(event.currentTarget);
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
      const { destination } = await APIResolveLoginDestination();
      window.location.replace(destination);
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Choose a new password" intro={PASSWORD_RULES.hint}>
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
