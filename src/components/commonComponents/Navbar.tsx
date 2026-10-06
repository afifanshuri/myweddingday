"use client";

import MainButton from "./MainButton";
import { useSyncExternalStore } from "react";

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
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-4 border-b px-4 py-5 text-xs text-white transition-all duration-300 motion-reduce:transition-none sm:gap-8 sm:px-6 sm:text-sm lg:gap-12 ${
        isScrolled
          ? "border-white/15 bg-black/55 shadow-lg shadow-black/10 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-transparent backdrop-blur-none"
      }`}
    >
      <MainButton variant="custom" size="none"
        href="#how-it-works"
        className="whitespace-nowrap rounded-sm transition hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        How it works
      </MainButton>
      <MainButton variant="custom" size="none"
        href="#features"
        className="rounded-sm transition hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        Features
      </MainButton>
      <MainButton variant="custom" size="none"
        href="#pricing"
        className="rounded-sm transition hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        Pricing
      </MainButton>
      <MainButton variant="custom" size="none"
        href="/login"
        className="rounded-sm transition hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        Login
      </MainButton>
    </nav>
  );
}
