"use client";
import MainButton from "@/components/commonComponents/MainButton";


import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { APICreateAuthAccount, APICreateAuthSession } from "@/services/api/auth";

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setIsSubmitting(true);
    setMessage("");
    try {
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
      // This selects a destination only; the write API independently verifies admin access.
      router.replace(data.user?.app_metadata.role === "admin" ? "/admin" : "/weddingplan");
      router.refresh();
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-sm rounded-md border border-stone-200 bg-white p-7 shadow-sm sm:p-9">
        <h1 className="libre-font mb-2 text-3xl text-stone-900">
          {isRegistering ? "Create account" : "Welcome back"}
        </h1>
        <p className="mb-7 text-sm text-stone-600">
          {isRegistering ? "Sign up to get started." : "Sign in to continue."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm text-stone-700">
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              disabled={isSubmitting}
              className="mt-2 block w-full rounded-sm border border-stone-300 bg-transparent px-3 py-2.5 outline-none focus:border-(--positive-tertiary)"
            />
          </label>
          <label className="block text-sm text-stone-700">
            Password
            <input
              type="password"
              name="password"
              autoComplete={isRegistering ? "new-password" : "current-password"}
              minLength={6}
              required
              disabled={isSubmitting}
              className="mt-2 block w-full rounded-sm border border-stone-300 bg-transparent px-3 py-2.5 outline-none focus:border-(--positive-tertiary)"
            />
          </label>

          {message && (
            <p role="status" className="text-sm text-stone-600">
              {message}
            </p>
          )}

          <MainButton
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Please wait..." : isRegistering ? "Create account" : "Sign in"}
          </MainButton>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          {isRegistering ? "Already have an account?" : "New here?"}{" "}
          <MainButton variant="link" size="none"
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setIsRegistering(!isRegistering);
              setMessage("");
            }}
          >
            {isRegistering ? "Sign in" : "Create an account"}
          </MainButton>
        </p>
      </section>
    </main>
  );
}
