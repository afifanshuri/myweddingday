import { BsStarFill } from "react-icons/bs";
import Carousel from "@/components/commonComponents/carousel/Carousel";

const vendorSpotlights = [
  {
    category: "Venue",
    initials: "VN",
    description:
      "A beautiful setting for your celebration, from an intimate ceremony to a grand reception.",
  },
  {
    category: "Catering",
    initials: "CT",
    description:
      "Memorable menus and thoughtful service to bring everyone together around the table.",
  },
  {
    category: "Photography",
    initials: "PH",
    description:
      "Capture the big moments and the little details you will want to remember forever.",
  },
  {
    category: "Pelamin",
    initials: "PL",
    description:
      "A backdrop that brings your wedding style to life, with details that feel like you.",
  },
  {
    category: "Bridal attire",
    initials: "BA",
    description:
      "Find a look that feels just right for your day, from classic silhouettes to modern designs.",
  },
  {
    category: "Makeup",
    initials: "MU",
    description:
      "Complete your wedding look with makeup and styling that help you feel your best.",
  },
];

export default function StarVendors() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="min-h-[100vh] scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-xs font-semibold tracking-widest text-(--positive-tertiary) uppercase">
          In the spotlight
        </p>
        <h2
          id="features-heading"
          className="libre-font text-3xl text-(--positive-tertiary) sm:text-4xl"
        >
          Star vendors
        </h2>
        <p className="mt-5 text-base leading-7 text-foreground/65">
          Meet the people who could bring your wedding ideas to life.
        </p>
        <p className="mt-3 text-xs text-foreground/50">
          A preview of our vendor showcase. Featured vendor profiles are coming
          soon.
        </p>
      </div>
      <div className="mt-10">
        <Carousel
          slides={vendorSpotlights.map((_, index) => index)}
          options={{ loop: true }}
          ariaLabel="Star vendors preview"
          renderSlide={(index) => {
            const { category, initials, description } = vendorSpotlights[index];
            return (
              <article className="h-full overflow-hidden rounded-3xl border border-(--tertiary) bg-white text-left shadow-sm">
                <div className="relative flex h-44 items-center justify-center bg-(--secondary)">
                  <span
                    aria-hidden="true"
                    className="libre-font text-5xl text-(--fourth)"
                  >
                    {initials}
                  </span>
                  <span className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs text-(--positive-tertiary)">
                    <BsStarFill aria-hidden="true" /> Vendor spotlight
                  </span>
                  <span className="absolute right-4 bottom-4 text-xs text-foreground/50">
                    Profile coming soon
                  </span>
                </div>
                <div className="p-6">
                  <p className="mb-2 text-xs font-medium tracking-wide text-(--positive-tertiary) uppercase">
                    {category}
                  </p>
                  <h3 className="libre-font text-xl text-(--positive-tertiary)">
                    Your next {category.toLowerCase()} discovery
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
