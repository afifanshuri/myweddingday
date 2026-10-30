"use client";

import MainButton from "./MainButton";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { ROUTES } from "@/config/routes";

function subscribeToScroll(onScroll: () => void) {
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

function getScrollSnapshot() {
  return window.scrollY > 16;
}

function getServerSnapshot() {
  return false;
}

export default function Navbar() {
  const isScrolled = useSyncExternalStore(
    subscribeToScroll,
    getScrollSnapshot,
    getServerSnapshot,
  );

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed inset-x-0 top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 text-xs text-white transition-all duration-300 motion-reduce:transition-none sm:flex-nowrap sm:px-6 sm:text-sm ${
        isScrolled
          ? "border-white/15 bg-black/55 shadow-lg shadow-black/10 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-transparent backdrop-blur-none"
      }`}
    >
      <MainButton
        variant="custom"
        size="none"
        href="#mainContainer"
        aria-label="My Wedding Day — back to top"
        className="shrink-0 gap-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:gap-2"
      >
        <Image
          src="/brand/my-wedding-day-mark-knot.png"
          alt="My Wedding Day"
          width={48}
          height={48}
          priority
          className="size-12"
        />
        <span className="libre-font whitespace-nowrap text-lg font-extralight sm:text-l">
          myweddingday.
        </span>
      </MainButton>
      <div className="flex items-center gap-4 sm:gap-8 lg:gap-12">
        <MainButton
          variant="custom"
          size="none"
          href="#how-it-works"
          className="whitespace-nowrap rounded-sm transition hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          How it works
        </MainButton>
        <MainButton
          variant="custom"
          size="none"
          href="#pricing"
          className="rounded-sm transition hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Pricing
        </MainButton>
        <MainButton
          variant="custom"
          size="none"
          href={ROUTES.login}
          className="rounded-sm transition hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Login
        </MainButton>
      </div>
    </nav>
  );
}
