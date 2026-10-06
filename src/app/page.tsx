"use client";
import Carousel from "@/components/commonComponents/carousel/Carousel";
import MainButton from "@/components/commonComponents/MainButton";
import Navbar from "@/components/commonComponents/Navbar";
import HowItWorks from "@/components/commonComponents/HowItWorks";
import { motion } from "motion/react";
import Image from "next/image";

const pricingPlans = [
  {
    name: "Free",
    price: "RM0",
    description: "A simple way to start exploring your options.",
    featured: false,
    benefits: [
      "3 manual searches per day",
      "Updated searches count toward your daily limit",
      "A limited preview of vendor matches",
      "One AI-powered trial search",
    ],
  },
  {
    name: "Plus ✨",
    price: "RM10",
    description: "More freedom to find the right vendors for your wedding.",
    featured: true,
    benefits: [
      "Unlimited manual searches",
      "Edit and rerun your searches anytime",
      "5 AI-powered searches per week",
      "AI-assisted matches tailored to your budget and preferences",
      "Full access to all vendors",
    ],
  },
];

export default function Home() {
  return (
    <main>
      <Navbar />
      <div
        id="mainContainer"
        className="relative isolate flex flex-col justify-center items-center mx-auto min-h-screen py-24 text-center text-white"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 overflow-hidden"
        >
          <Image
            src="/bgImage/backgroundimage.webp"
            alt=""
            fill
            priority
            className="object-cover scale-105 blur-sm brightness-30"
            sizes="100vw"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
          className="relative z-10 flex flex-col xl:w-1/2 items-center mx-auto text-center text-white"
        >
          <p className="libre-font text-[40px] xl:text-[60px] leading-10 xl:leading-14 mb-14 font-light tracking-tighter">
            Planning a <span className="italic">wedding</span> have never been
            easier, until now
          </p>
          <p className="text-[20px] w-3/4 leading-7 mb-8 opacity-50 font-light tracking-tight">
            Describe your wedding. Choose freely from over 10,000+ wedding
            vendors, tailored exactly to your liking
          </p>
          <div className="flex flex-row gap-2 mb-2 opacity-50 hover:opacity-100 text-black">
            <MainButton href="/weddingplan">Start Planning</MainButton>
          </div>
          <p className="opacity-50">6 Categories - Takes about 5 minutes</p>
        </motion.div>
      </div>
      <HowItWorks />
      <section
        id="features"
        aria-labelledby="features-heading"
        className="flex min-h-[100vh] scroll-mt-24 flex-col items-center justify-center gap-4 px-6 py-24 text-center"
      >
        <h2 id="features-heading" className="libre-font text-3xl sm:text-4xl">
          Features
        </h2>
        <p className="text-foreground/60">Features content coming soon.</p>
        <div className="w-full">
          <Carousel
            slides={Array.from(Array(8).keys())}
            options={{ loop: true }}
          />
        </div>
      </section>
      <section
        id="pricing"
        aria-labelledby="pricing-heading"
        className="home-pricing flex min-h-[100vh] scroll-mt-24 flex-col items-center justify-center gap-4 px-6 py-24 text-center"
      >
        <h2 id="pricing-heading" className="libre-font text-3xl sm:text-4xl">
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
                  {plan.featured ? "/ month" : "Free"}
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
        <MainButton href="/payment" className="mt-4 px-8 py-3">
          Upgrade to Plus — RM10/month
        </MainButton>
      </section>
    </main>
  );
}
