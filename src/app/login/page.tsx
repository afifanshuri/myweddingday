"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Authentication is not connected yet.");
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
              className="mt-2 block w-full rounded-sm border border-stone-300 bg-transparent px-3 py-2.5 outline-none focus:border-(--positive-tertiary)"
            />
          </label>

          {message && (
            <p role="status" className="text-sm text-stone-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-sm bg-(--positive-secondary) px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            {isRegistering ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          {isRegistering ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setMessage("");
            }}
            className="font-medium text-(--positive-tertiary) underline underline-offset-4"
          >
            {isRegistering ? "Sign in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}
