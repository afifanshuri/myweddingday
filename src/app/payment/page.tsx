import MainButton from "@/components/commonComponents/MainButton";

export default function PaymentPage() {
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
            RM10 <span className="text-sm font-normal">/ month</span>
          </p>
        </div>
        <p className="mt-6 font-normal text-foreground/60">
          Payment checkout is coming soon.
        </p>
        <MainButton
          href="/#pricing"
          className="mt-8"
        >
          Back to pricing
        </MainButton>
      </section>
    </main>
  );
}
