"use client";
import MainButton from "@/components/commonComponents/MainButton";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-5 px-6 text-center">
    <h1 className="libre-font text-2xl">Unable to load this page</h1>
    <p>Please try again. Your saved wedding plan has not been cleared.</p>
    <MainButton onClick={reset}>Try again</MainButton>
  </main>;
}
