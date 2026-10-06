"use client";

import { useEffect, useRef, useState } from "react";
import AIBudgetInput from "./AIBudgetInput";
import CustomTextarea from "@/components/commonComponents/CustomTextarea";
import MainButton from "@/components/commonComponents/MainButton";
import { SERVICE_ID } from "@/config/serviceCriteria";
import { usePreferenceStore } from "@/store/preferenceStore";
import type { LocationType, ServiceType } from "@/types/dataTypes";

const suggestions = [
  "Garden wedding",
  "Traditional Malay",
  "Minimalist",
  "Budget-friendly",
];

export default function AISearchPanel({
  locations,
  services,
  validateDetails,
}: {
  locations: LocationType[];
  services: ServiceType[];
  validateDetails: () => boolean;
}) {
  const details = usePreferenceStore((state) => state.weddingDetails);
  const preferences = usePreferenceStore((state) => state.preferencesList);
  const updatePreference = usePreferenceStore(
    (state) => state.updatePreferenceDetails,
  );
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{
    description?: string;
    budgets?: string;
  }>({});
  const [showReview, setShowReview] = useState(false);
  const reviewRef = useRef<HTMLDivElement>(null);
  const selectedServices = services.filter((service) =>
    details.services.includes(service.id),
  );

  useEffect(() => {
    if (showReview) {
      reviewRef.current?.focus({ preventScroll: true });
      reviewRef.current?.scrollIntoView({ block: "start" });
    }
  }, [showReview]);

  function reviewSearch() {
    const validDetails = validateDetails();
    const nextErrors: typeof errors = {};
    if (!description.trim())
      nextErrors.description = "Describe the wedding you have in mind.";
    if (
      selectedServices.some((service) => {
        const budget = preferences.find(
          (preference) => preference.serviceId === service.id,
        )?.budget;
        return (
          !budget ||
          !Number.isFinite(budget) ||
          budget <= 0 ||
          budget > 1000000000
        );
      })
    )
      nextErrors.budgets =
        "Enter a valid positive budget for each selected service.";
    setErrors(nextErrors);
    setShowReview(validDetails && Object.keys(nextErrors).length === 0);
  }

  return (
    <section
      aria-labelledby="ai-search-heading"
      className="space-y-6 rounded-2xl border border-(--tertiary) bg-white/70 p-5 sm:p-7"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="ai-search-heading" className="libre-font text-xl">
            3. Describe Your Wedding
          </h2>
          <span className="rounded-full bg-(--secondary) px-3 py-1 text-xs">
            UI preview
          </span>
        </div>
        <p className="mt-2 text-sm font-normal text-foreground/65">
          Share your style, priorities, and anything that matters to you.
        </p>
      </div>
      <div>
        <label htmlFor="ai-description" className="block text-sm">
          Tell us what you&apos;re looking for
        </label>
        <CustomTextarea
          id="ai-description"
          rows={6}
          maxLength={4000}
          value={description}
          placeholder="An intimate garden wedding in Shah Alam for 200 guests, with pastel décor and candid photography."
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? "ai-description-error" : undefined
          }
          className="mt-2 w-full p-3 text-sm font-normal leading-6"
          onChange={(event) => {
            setDescription(event.target.value);
            setShowReview(false);
            setErrors((current) => ({ ...current, description: undefined }));
          }}
        />
        {errors.description && (
          <p
            id="ai-description-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.description}
          </p>
        )}
      </div>
      <fieldset
        aria-describedby={`ai-budget-help${errors.budgets ? " ai-budget-error" : ""}`}
      >
        <legend className="text-sm">Your service budgets</legend>
        <p
          id="ai-budget-help"
          className="mt-1 text-xs font-normal text-foreground/60"
        >
          Set a maximum for each service. Catering is priced per guest.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {selectedServices.map((service) => (
            <AIBudgetInput
              key={service.id}
              service={service}
              budget={
                preferences.find(
                  (preference) => preference.serviceId === service.id,
                )?.budget ?? 0
              }
              hasError={!!errors.budgets}
              onChange={(budget) => {
                updatePreference(service.id, { budget });
                setShowReview(false);
                setErrors((current) => ({ ...current, budgets: undefined }));
              }}
            />
          ))}
        </div>
        {selectedServices.length === 0 && (
          <p className="mt-3 text-sm font-normal text-foreground/60">
            Choose services above to set their budgets.
          </p>
        )}
        {errors.budgets && (
          <p
            id="ai-budget-error"
            role="alert"
            className="mt-2 text-sm text-red-600"
          >
            {errors.budgets}
          </p>
        )}
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--tertiary) pt-5">
        <p className="text-xs font-normal text-foreground/60">
          Preview only · No AI searches used
        </p>
        <MainButton
          type="button"
          onClick={reviewSearch}
          className="px-5 py-3 text-sm"
        >
          Review my search
        </MainButton>
      </div>
      {showReview && (
        <div
          ref={reviewRef}
          tabIndex={-1}
          aria-labelledby="ai-review-heading"
          className="scroll-mt-8 space-y-5 rounded-2xl border border-(--positive-secondary) bg-(--secondary) p-5 focus:outline-none"
        >
          <div>
            <h3 id="ai-review-heading" className="libre-font text-xl">
              Review your search
            </h3>
            <p className="mt-2 text-sm font-normal text-foreground/65">
              These are the details you entered. AI interpretation is coming
              soon.
            </p>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-foreground/60">Couple</dt>
              <dd>{details.coupleName}</dd>
            </div>
            <div>
              <dt className="text-foreground/60">Wedding date</dt>
              <dd>{details.date}</dd>
            </div>
            <div>
              <dt className="text-foreground/60">Guests</dt>
              <dd>{details.pax}</dd>
            </div>
            <div>
              <dt className="text-foreground/60">Locations</dt>
              <dd>
                {locations
                  .filter((location) => details.locations.includes(location.id))
                  .map((location) => location.locationName)
                  .join(", ")}
              </dd>
            </div>
          </dl>
          <div>
            <p className="text-sm text-foreground/60">Service budgets</p>
            <ul className="mt-1 space-y-1 text-sm font-normal">
              {selectedServices.map((service) => (
                <li key={service.id}>
                  {service.serviceName}: RM
                  {preferences
                    .find((preference) => preference.serviceId === service.id)
                    ?.budget?.toLocaleString("en-MY")}
                  {service.id === SERVICE_ID.CATERING ? " / guest" : ""}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm text-foreground/60">Your description</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm font-normal">
              {description}
            </p>
          </div>
          <MainButton variant="link" size="none"
            type="button"
            className="text-sm"
            onClick={() => {
              setShowReview(false);
              document.getElementById("ai-description")?.focus();
            }}
          >
            Edit my search
          </MainButton>
          <div className="border-t border-(--tertiary) pt-4">
            <MainButton
              type="button"
              disabled
              aria-describedby="ai-generation-note"
              className="w-full py-3 disabled:cursor-default disabled:opacity-50"
            >
              Generate matches · Coming soon
            </MainButton>
            <p
              id="ai-generation-note"
              className="mt-2 text-center text-xs font-normal text-foreground/65"
            >
              AI generation and your search allowance will be available when AI
              search launches.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
