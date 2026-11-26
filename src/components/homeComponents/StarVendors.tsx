"use client";
import { useT } from "@/i18n";

import { BsStarFill } from "react-icons/bs";
import Carousel from "@/components/commonComponents/carousel/Carousel";

// Placeholder initials per spotlight, in the same order as the text in the dictionaries.
const initials = ["VN", "CT", "PH", "PL", "BA", "MU"];

export default function StarVendors() {
  const t = useT();
  const spotlights = t.landing.star.items;
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="min-h-[100vh] scroll-mt-24 px-3 py-20 sm:px-4 sm:py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-xs font-semibold tracking-widest text-(--positive-tertiary) uppercase">
          {t.landing.star.eyebrow}
        </p>
        <h2
          id="features-heading"
          className="libre-font text-4xl leading-tight text-(--positive-tertiary) sm:text-5xl lg:text-6xl"
        >
          {t.landing.star.title}
        </h2>
        <p className="mt-5 text-base leading-7 text-foreground/65">
          {t.landing.star.text}
        </p>
        <p className="mt-3 text-xs text-foreground/50">
          {t.landing.star.note}
        </p>
      </div>
      <div className="mt-10">
        <Carousel
          slides={spotlights.map((_, index) => index)}
          options={{ loop: true }}
          ariaLabel={t.landing.star.aria}
          renderSlide={(index) => {
            const { category, description } = spotlights[index];
            return (
              <article className="h-full overflow-hidden rounded-3xl border border-(--tertiary) bg-white text-left shadow-sm">
                <div className="relative flex h-44 items-center justify-center bg-(--secondary)">
                  <span
                    aria-hidden="true"
                    className="libre-font text-5xl text-(--fourth)"
                  >
                    {initials[index]}
                  </span>
                  <span className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs text-(--positive-tertiary)">
                    <BsStarFill aria-hidden="true" /> {t.landing.star.badge}
                  </span>
                  <span className="absolute right-4 bottom-4 text-xs text-foreground/50">
                    {t.landing.star.soon}
                  </span>
                </div>
                <div className="p-6">
                  <p className="mb-2 text-xs font-medium tracking-wide text-(--positive-tertiary) uppercase">
                    {category}
                  </p>
                  <h3 className="libre-font text-xl text-(--positive-tertiary)">
                    {t.landing.star.discovery(category)}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-foreground/65">
                    {description}
                  </p>
                </div>
              </article>
            );
          }}
        />
      </div>
    </section>
  );
}
