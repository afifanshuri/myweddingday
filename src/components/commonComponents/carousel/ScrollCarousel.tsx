"use client";

import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useT } from "@/i18n";

/**
 * A row of anything that slides sideways: swipe or scroll it, or use the Previous/Next buttons. Each child is one
 * slide. Native scrolling with snap points, so touch, trackpads and keyboard scrolling work as usual; it never moves
 * on its own. The next slide peeks in at the edge so it's clear there is more.
 *
 *   <ScrollCarousel label="Catering shortlist" slideWidth="min(85%, 15rem)">
 *     {vendors.map((vendor) => <VendorCard key={vendor.id} ... />)}
 *   </ScrollCarousel>
 */
export default function ScrollCarousel({ label, children, slideWidth = "min(85%, 18rem)", gap = "1rem", className = "" }: {
  /** Names the carousel for screen readers, e.g. "Catering shortlist". */
  label: string;
  children: ReactNode;
  /** Width of each slide: any CSS length. Leave room for the next slide to peek in. */
  slideWidth?: string;
  gap?: string;
  className?: string;
}) {
  const t = useT();
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const slides = Children.toArray(children);

  // Which ends have been reached, so the buttons can say there's nothing further that way.
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => setEdges({
      start: element.scrollLeft <= 1,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
    });
    measure();
    element.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { element.removeEventListener("scroll", measure); observer.disconnect(); };
  }, [slides.length]);

  const slideBy = (direction: 1 | -1) => {
    const element = track.current;
    if (!element) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A little under the visible width, so the slide at the edge stays partly in view as a landmark.
    element.scrollBy({ left: direction * element.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };

  const button = "grid size-9 place-items-center rounded-full border border-(--tertiary) bg-white text-(--positive-tertiary) transition-opacity hover:bg-(--secondary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary) aria-disabled:cursor-default aria-disabled:opacity-35 aria-disabled:hover:bg-white";

  return <section aria-roledescription="carousel" aria-label={label} className={`min-w-0 ${className}`}>
    <div ref={track} tabIndex={0}
      className="-mx-1 flex snap-x snap-mandatory scroll-px-1 overflow-x-auto overscroll-x-contain scroll-smooth px-1 pb-3 pt-1 [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary) motion-reduce:scroll-auto"
      style={{ gap } as CSSProperties}>
      {slides.map((slide, index) => <div key={index} role="group" aria-roledescription="slide" aria-label={t.carousel.slideOf(index + 1, slides.length)}
        className="shrink-0 snap-start" style={{ width: slideWidth }}>
        {slide}
      </div>)}
    </div>
    {/* Hidden when everything already fits. */}
    {!(edges.start && edges.end) && <div className="mt-1 flex justify-end gap-2">
      <button type="button" aria-label={t.carousel.previous} aria-disabled={edges.start} onClick={() => { if (!edges.start) slideBy(-1); }} className={button}>
        <FiChevronLeft aria-hidden="true" className="size-5" />
      </button>
      <button type="button" aria-label={t.carousel.next} aria-disabled={edges.end} onClick={() => { if (!edges.end) slideBy(1); }} className={button}>
        <FiChevronRight aria-hidden="true" className="size-5" />
      </button>
    </div>}
  </section>;
}
