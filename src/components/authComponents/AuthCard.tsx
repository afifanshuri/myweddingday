"use client";
import LanguageSwitch from "@/components/commonComponents/LanguageSwitch";

import type { ReactNode } from "react";

/** Shared layout for the login, forgot-password and reset-password pages. */
export default function AuthCard({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-12">
      {/* Signed-out visitors choose their language here too. */}
      <LanguageSwitch className="absolute right-4 top-4 sm:right-6 sm:top-6" />
      <section className="w-full max-w-sm rounded-md border border-stone-200 bg-white p-7 shadow-sm sm:p-9">
        <h1 className="libre-font mb-2 text-3xl text-stone-900">{title}</h1>
        <p className="mb-7 text-sm text-stone-600">{intro}</p>
        {children}
      </section>
    </main>
  );
}

export const authInputClass = "mt-2 block w-full rounded-sm border border-stone-300 bg-transparent px-3 py-2.5 outline-none focus:border-(--positive-tertiary)";
