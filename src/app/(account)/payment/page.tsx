import MainButton from "@/components/commonComponents/MainButton";
import { Suspense } from "react";
import { requirePageAccess } from "@/services/others/pageAccessService";
import { ROUTES, canAccessRoute, getDefaultRoute, getSafeReturnPath } from "@/config/routes";
import { PLANS } from "@/config/plans";

type Props = { searchParams: Promise<{ returnTo?: string | string[] }> };
async function PaymentContent({ searchParams }: Props) {
  const { returnTo } = await searchParams;
  const destination = typeof returnTo === "string"
    ? getSafeReturnPath(`${ROUTES.payment}?returnTo=${encodeURIComponent(returnTo)}`) ?? ROUTES.payment : ROUTES.payment;
  const access = await requirePageAccess("signedIn");
  const safeReturnTo = new URL(destination, "https://routing.invalid").searchParams.get("returnTo");
  const back = safeReturnTo && canAccessRoute(access, safeReturnTo) ? safeReturnTo : getDefaultRoute(access);
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section
        aria-labelledby="payment-heading"
        className="w-full max-w-lg rounded-3xl border border-(--tertiary) bg-white/80 p-8 text-center shadow-sm sm:p-12"
      >
        <h1 id="payment-heading" className="libre-font text-3xl sm:text-4xl">
          Payment
        </h1>
        <div className="mt-8 rounded-2xl bg-(--secondary) p-6">
          <h2 className="libre-font text-xl text-(--positive-tertiary)">
            Plus plan
          </h2>
          <p className="mt-3 text-3xl font-semibold">
            RM{PLANS.plus.priceMYR} <span className="text-sm font-normal">one-time</span>
          </p>
          <p className="mt-3 text-sm text-foreground/65">
            Includes {PLANS.plus.durationYears} year of access from purchase. No automatic renewal.
          </p>
        </div>
        <p className="mt-6 font-normal text-foreground/60">
          Payment checkout is coming soon.
        </p>
        <MainButton
          href={back}
          className="mt-8"
        >
          {back === ROUTES.match ? "Back to matches" : "Back"}
        </MainButton>
      </section>
    </main>
  );
}

export default function PaymentPage(props: Props) {
  return <Suspense fallback={<p role="status" className="p-6">Checking account access…</p>}><PaymentContent {...props} /></Suspense>;
}
