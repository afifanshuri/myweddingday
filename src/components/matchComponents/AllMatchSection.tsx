"use client";
import MainButton from "@/components/commonComponents/MainButton";
import { FaLock } from "react-icons/fa";
import { paymentRoute } from "@/config/routes";
import { ServiceType } from "@/types/dataTypes";
import { VendorMatchResult } from "@/types/dtoTypes";
import VendorContainer from "./VendorContainer";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export default function AllMatchSection({
  matches,
  topMatches,
  servicesList,
  onSelect,
  activeServiceId,
  onServiceChange,
  loading = false,
  lockedCount = 0,
}: {
  matches: VendorMatchResult[];
  topMatches: VendorMatchResult[];
  servicesList: Pick<ServiceType, "id" | "serviceName">[];
  onSelect: (vendorId: number) => void;
  activeServiceId: number | null;
  onServiceChange: (serviceId: number | null) => void;
  /** The page for the chosen filter is still loading: don't say "no vendors" yet. */
  loading?: boolean;
  /** Matches hidden from this free account (Plus shows them). */
  lockedCount?: number;
}) {
  const visibleMatches = matches;
  const reduceMotion = useReducedMotion();
  const filters = [{ id: null, serviceName: "All services" }, ...servicesList];

  return (
    <section
      aria-labelledby="all-match-heading"
      className="min-w-0 rounded-lg border border-(--secondary) bg-white p-4 sm:p-6"
    >
      <h2 id="all-match-heading" className="libre-font text-lg">
        All Vendors
      </h2>
      <div
        className="my-5 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter matches by service"
      >
        {filters.map((service) => (
          <MainButton
            variant="choice"
            size="small"
            key={service.id ?? "all"}
            type="button"
            aria-pressed={activeServiceId === service.id}
            onClick={() => onServiceChange(service.id)}
          >
            {service.serviceName}
          </MainButton>
        ))}
      </div>
      {loading ? (
        // Placeholder cards shaped like vendor cards while the chosen filter's page loads.
        <div
          role="status"
          aria-label="Loading vendors"
          className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              aria-hidden="true"
              className="flex flex-col overflow-hidden rounded-lg border border-(--tertiary) bg-white animate-pulse motion-reduce:animate-none"
            >
              <div className="min-h-32 bg-(--secondary) sm:min-h-44" />
              <div className="flex min-h-36 flex-col gap-3 p-3 sm:min-h-44 sm:p-4">
                <div className="h-4 w-1/3 rounded bg-(--secondary)" />
                <div className="h-3 w-2/3 rounded bg-(--secondary)" />
                <div className="mt-auto border-t border-(--secondary) pt-3">
                  <div className="h-3 w-1/4 rounded bg-(--secondary)" />
                  <div className="mt-2 h-5 w-1/2 rounded bg-(--secondary)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : visibleMatches.length > 0 || lockedCount > 0 ? (
        <motion.div
          layout={!reduceMotion}
          className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
        >
          {/* Cards fade in and out when the filter or page changes; the ones that stay glide to their new places. */}
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleMatches.map((match, index) => (
              <motion.div
                key={match.vendor.id}
                layout={!reduceMotion}
                initial={
                  reduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  reduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : {
                        opacity: 0,
                        scale: 0.97,
                        transition: { duration: 0.15 },
                      }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.28,
                        ease: [0.22, 1, 0.36, 1],
                        delay: Math.min(index, 8) * 0.03,
                      }
                }
              >
                <VendorContainer
                  key={match.vendor.id}
                  match={match}
                  onSelect={onSelect}
                  serviceName={
                    servicesList.find(
                      (service) => service.id === match.vendor.serviceId,
                    )?.serviceName ?? "Service"
                  }
                  topPick={topMatches.some(
                    (topMatch) => topMatch.vendor.id === match.vendor.id,
                  )}
                />
              </motion.div>
            ))}
            {/* Free accounts: the matches their free search didn't unlock are only counted, never sent. */}
            {lockedCount > 0 && (
              <motion.div
                key="locked"
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={
                  reduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : { opacity: 0, transition: { duration: 0.15 } }
                }
              >
                <div className="flex h-full min-h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-(--positive-secondary) bg-(--background) p-4 sm:gap-3 sm:p-6 text-center">
                  <FaLock
                    aria-hidden="true"
                    className="text-xl text-(--positive-tertiary)"
                  />
                  <p className="libre-font text-2xl text-(--positive-tertiary)">
                    +{lockedCount} more
                  </p>
                  <p className="text-sm font-normal text-foreground/70">
                    {lockedCount === 1
                      ? "Another vendor matches"
                      : `${lockedCount} more vendors match`}{" "}
                    your preferences. Plus shows them all, with full details.
                  </p>
                  <MainButton href={paymentRoute()} size="small">
                    Get Plus
                  </MainButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <p className="py-6 text-sm font-normal">
          No other vendors match this selection. Your best matches are shown
          above.
        </p>
      )}
    </section>
  );
}
