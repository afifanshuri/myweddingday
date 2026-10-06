import { BsCalendarEvent, BsCheck2, BsGrid, BsSliders } from "react-icons/bs";
import MainButton from "./MainButton";

const steps = [
  {
    title: "Tell us about your day",
    description: "Add your wedding date, guest count, and preferred locations. Choose the services you need help finding.",
    icon: BsCalendarEvent,
  },
  {
    title: "Make the search yours",
    description: "Set a budget for each service, choose your preferences, and mark the details your vendors must have.",
    icon: BsSliders,
  },
  {
    title: "Explore your matches",
    description: "Browse recommended vendors and compare their matched packages, prices, and inclusions in one place.",
    icon: BsGrid,
  },
];

function StepPreview({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-medium text-(--positive-tertiary)">Your wedding details</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-(--tertiary) bg-white px-3 py-2.5">
            <p className="text-[11px] text-foreground/55">Guests</p>
            <p className="mt-1 text-sm font-medium">200 guests</p>
          </div>
          <div className="rounded-xl border border-(--tertiary) bg-white px-3 py-2.5">
            <p className="text-[11px] text-foreground/55">Location</p>
            <p className="mt-1 text-sm font-medium">Selangor</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Venue", "Catering", "Photography"].map((service) => (
            <span key={service} className="flex items-center gap-1 rounded-full border border-(--positive-secondary) bg-(--positive)/20 px-2.5 py-1.5 text-[11px] text-(--positive-tertiary)">
              <BsCheck2 /> {service}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-(--tertiary) bg-white p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium">Photography</p>
              <p className="mt-1 text-[11px] text-foreground/55">Total budget</p>
            </div>
            <p className="libre-font whitespace-nowrap text-lg text-(--positive-tertiary)">RM 3,000</p>
          </div>
          <div className="relative mt-4 h-1.5 rounded-full bg-(--secondary)">
            <div className="h-full w-2/5 rounded-full bg-(--positive-tertiary)" />
            <span className="absolute top-1/2 left-2/5 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--positive-tertiary)" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-xl border border-(--positive-secondary) bg-(--positive)/15 px-3 py-2.5 text-xs text-(--positive-tertiary)">
          <span>Candid photography</span>
          <span className="flex items-center gap-1 whitespace-nowrap font-medium"><BsCheck2 /> Must have</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-(--positive-tertiary)">Compare matched packages</p>
      {[{ label: "Photography package", price: "RM 2,500", topPick: true }, { label: "Photography package", price: "RM 2,800", topPick: false }].map((item, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border border-(--tertiary) bg-white p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--secondary) text-(--positive-tertiary)"><BsGrid /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">{item.label}</p>
            <p className="mt-1 text-xs text-foreground/60">{item.price}</p>
          </div>
          {item.topPick && <span className="shrink-0 rounded-full bg-(--positive)/25 px-2 py-1 text-[10px] text-(--positive-tertiary)">Top pick</span>}
        </div>
      ))}
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-24 border-b border-(--tertiary) bg-(--background) px-5 py-20 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold tracking-widest text-(--positive-tertiary) uppercase">From your ideas to your shortlist</p>
          <h2 id="how-it-works-heading" className="libre-font text-3xl text-(--positive-tertiary) sm:text-4xl">How it works</h2>
          <p className="mt-5 text-base leading-7 text-foreground/65">Find vendors that fit your wedding, your priorities, and your budget. Start with a few details and take it one step at a time.</p>
        </div>

        <ol className="mt-12 grid gap-5 lg:grid-cols-3">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <li key={title} className="flex min-w-0 flex-col rounded-3xl border border-(--tertiary) bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-center justify-between">
                <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-2xl bg-(--secondary) text-xl text-(--positive-tertiary)"><Icon /></span>
                <span className="text-xs font-medium tracking-wider text-foreground/45">STEP 0{index + 1}</span>
              </div>
              <h3 className="libre-font text-xl text-(--positive-tertiary)">{title}</h3>
              <p className="mt-3 mb-6 text-sm leading-6 text-foreground/65">{description}</p>
              <div aria-hidden="true" className="mt-auto rounded-2xl bg-(--background) p-4">
                <StepPreview step={index} />
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-center text-xs text-foreground/50">Illustrative previews. Your details and results will vary.</p>

        <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl border border-(--tertiary) bg-(--secondary)/60 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-(--positive-tertiary)">Prefer to describe your wedding in your own words?</p>
            <p className="mt-2 text-sm leading-6 text-foreground/65">Try the AI search preview to describe your ideas and review your budgets. AI-generated matches are coming soon.</p>
          </div>
          <MainButton href="/weddingplan" className="w-full shrink-0 sm:w-auto">Start planning your wedding</MainButton>
        </div>
      </div>
    </section>
  );
}
