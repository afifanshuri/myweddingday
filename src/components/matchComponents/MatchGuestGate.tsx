"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BsBookmark, BsCloudCheck, BsSearchHeart, BsUnlock } from "react-icons/bs";
import { useAccountAccess } from "@/components/commonComponents/AccountAccessProvider";
import { ROUTES } from "@/config/routes";
import { PLANS } from "@/config/plans";
import { WEDDING_PLAN } from "@/config/weddingPlan";

const POINTS = [
  { icon: BsSearchHeart, title: "Vendors that fit your budget", text: "Tell us your services, budget and must-haves. Your first search is free, with one vendor per service in full." },
  { icon: BsCloudCheck, title: "Your plan, saved", text: "Pick up where you left off, on any device." },
  { icon: BsBookmark, title: "A shortlist", text: `Keep up to ${WEDDING_PLAN.maxShortlist} vendors in view while you decide.` },
  { icon: BsUnlock, title: `Plus, RM${PLANS.plus.priceMYR} for a year`, text: "Search again whenever your plans change, and see every match, up to 10 per service, with names, contacts and packages." },
];
const cardLink = "inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive)";

/** Visitors who aren't signed in see this instead of results: planning and searching need an account. */
export default function MatchGuestGate({ children }: { children: ReactNode }) {
  const { access, checking } = useAccountAccess();
  if (checking || access.userId) return children;
  return <main className="mx-auto w-full max-w-4xl flex-1 space-y-10 p-4 sm:p-8">
    <section aria-labelledby="guest-match-heading" className="rounded-[2rem] bg-(--positive-tertiary) p-2 text-(--secondary) sm:p-2.5">
      <div className="rounded-[1.6rem] border border-(--positive)/35 px-6 py-10 sm:px-12 sm:py-14">
        <h1 id="guest-match-heading" className="libre-font max-w-[16ch] text-4xl leading-[1.1] text-white text-balance sm:text-5xl">Find vendors for your wedding</h1>
        <p className="mt-6 max-w-[52ch] text-base leading-7">Sign in or create a free account to plan your wedding and see vendors that fit your budget.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`${ROUTES.login}?mode=signup`} className={`${cardLink} bg-(--positive) text-(--positive-tertiary) hover:bg-white`}>Create a free account</Link>
          <Link href={ROUTES.login} className={`${cardLink} border border-(--positive)/60 text-white hover:bg-white/10`}>Sign in</Link>
        </div>
      </div>
    </section>
    <ul className="grid gap-6 sm:grid-cols-2">
      {POINTS.map(({ icon: Icon, title, text }) => <li key={title} className="flex gap-3">
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-(--secondary) text-(--positive-tertiary)"><Icon /></span>
        <div>
          <p className="text-sm font-semibold text-(--positive-tertiary)">{title}</p>
          <p className="mt-1 text-sm leading-6 text-foreground/70">{text}</p>
        </div>
      </li>)}
    </ul>
  </main>;
}
