import MainButton from "@/components/commonComponents/MainButton";
import { ROUTES } from "@/config/routes";
import { PLANS } from "@/config/plans";

const pricingPlans = [
  {
    name: "Free",
    price: "RM0",
    description: "A simple way to start exploring your options.",
    featured: false,
    benefits: [
      `${PLANS.free.manualSearchesPerDay} manual searches per day`,
      "Updated searches count toward your daily limit",
      PLANS.free.vendorPreviews === null ? "Preview all matching vendors" : `Up to ${PLANS.free.vendorPreviews} vendor previews per search`,
      `${PLANS.free.aiTrialSearches} AI-powered trial search (coming soon)`,
    ],
  },
  {
    name: "Plus ✨",
    price: `RM${PLANS.plus.priceMYR}`,
    description: `One payment for ${PLANS.plus.durationYears} year of wedding planning. No automatic renewal.`,
    featured: true,
    benefits: [
      "Unlimited manual searches",
      "Edit and rerun your searches anytime",
      `${PLANS.plus.aiSearchesPerWeek} AI-powered searches per week (coming soon)`,
      "AI-assisted matches tailored to your budget and preferences (coming soon)",
      "Unlock vendor names, contacts and package details",
    ],
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="home-pricing flex min-h-[100vh] scroll-mt-24 flex-col items-center justify-center gap-4 px-3 py-24 text-center sm:px-4"
    >
      <h2 id="pricing-heading" className="libre-font text-4xl leading-tight sm:text-5xl lg:text-6xl">
        Pricing
      </h2>
      <p className="max-w-lg text-foreground/60">
        Choose the plan that fits your wedding planning.
      </p>
      <div className="mt-8 grid w-full max-w-4xl grid-cols-1 gap-6 text-left md:grid-cols-2">
        {pricingPlans.map((plan) => (
          <article
            key={plan.name}
            aria-labelledby={`pricing-${plan.name.toLowerCase()}`}
            className={`rounded-3xl border p-7 shadow-sm sm:p-10 ${
              plan.featured
                ? "border-(--positive-secondary) bg-white/90 ring-1 ring-(--positive-secondary)"
                : "border-(--tertiary) bg-white/65"
            }`}
          >
            <h3
              id={`pricing-${plan.name.toLowerCase()}`}
              className="libre-font text-2xl text-(--positive-tertiary)"
            >
              {plan.name}
            </h3>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight">
                {plan.price}
              </span>
              <span className="text-sm font-normal text-foreground/60">
                {plan.featured ? `one-time · ${PLANS.plus.durationYears} year access` : "Free"}
              </span>
            </p>
            <p className="mt-4 min-h-12 text-sm font-normal leading-6 text-foreground/65">
              {plan.description}
            </p>
            <ul className="mt-7 space-y-4 border-t border-(--tertiary) pt-7">
              {plan.benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-3 text-sm leading-6"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 h-5 w-5 shrink-0 text-(--positive-secondary)"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                  <span className="font-normal">{benefit}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <MainButton href={ROUTES.payment} className="mt-4 px-8 py-3">
        Get {PLANS.plus.durationYears} year of Plus — RM{PLANS.plus.priceMYR} one-time
      </MainButton>
    </section>
  );
}
