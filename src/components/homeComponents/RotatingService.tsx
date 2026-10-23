"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const services = [
  "wedding venue",
  "catering",
  "makeup artist",
  "photographer",
  "bridal outfit",
  "pelamin",
];

export default function RotatingService() {
  const [index, setIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const service = reducedMotion ? services[0] : services[index];
  const wordRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number>();

  useEffect(() => {
    const word = wordRef.current;
    if (!word) return;
    const observer = new ResizeObserver(() =>
      setWidth(word.getBoundingClientRect().width),
    );
    observer.observe(word);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % services.length),
      2500,
    );
    return () => clearInterval(timer);
  }, [reducedMotion]);

  return (
    <>
      <span className="sr-only">wedding service</span>
      <motion.span
        aria-hidden="true"
        className="relative inline-block shrink-0 text-left italic text-(--positive)"
        initial={false}
        animate={width ? { width } : undefined}
        transition={{ duration: reducedMotion ? 0 : 0.3, ease: "easeOut" }}
      >
        <span
          ref={wordRef}
          className="invisible inline-block whitespace-nowrap px-1"
        >
          {service}
        </span>
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={service}
            className="absolute inset-0 whitespace-nowrap px-1"
            initial={{ opacity: 0, y: "35%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-35%" }}
            transition={{ duration: reducedMotion ? 0 : 0.15, ease: "easeOut" }}
          >
            {service}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  );
}
