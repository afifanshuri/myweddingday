"use client";
import { useEffect, useMemo, type ReactNode } from "react";
import type { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import "@/css/carousel.css";

type PropType = {
  slides: number[];
  ariaLabel?: string;
  renderSlide?: (index: number) => ReactNode;
  options?: EmblaOptionsType;
};

const Carousel = (props: PropType) => {
  const { slides, options, renderSlide, ariaLabel = "Feature carousel" } = props;
  const plugins = useMemo(() => [AutoScroll({ speed: 1 })], []);
  const [emblaRef, emblaApi] = useEmblaCarousel(options, plugins);

  useEffect(() => {
    if (!emblaApi) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncAutoScroll = () => {
      const autoScroll = emblaApi.plugins().autoScroll;
      if (reducedMotion.matches) autoScroll?.stop();
      else autoScroll?.play();
    };

    syncAutoScroll();
    emblaApi.on("reinit", syncAutoScroll);
    reducedMotion.addEventListener("change", syncAutoScroll);

    return () => {
      reducedMotion.removeEventListener("change", syncAutoScroll);
      emblaApi.off("reinit", syncAutoScroll);
      emblaApi.plugins().autoScroll?.stop();
    };
  }, [emblaApi]);

  return (
    <div
      className="home-carousel"
      role="region"
      aria-label={ariaLabel}
    >
      <div className="home-carousel-viewport" ref={emblaRef}>
        <div className="home-carousel-container">
          {slides.map((index) => (
            <div className="home-carousel-slide" key={index}>
              {renderSlide ? (
                renderSlide(index)
              ) : (
                <div className="home-carousel-number">
                <span>{index + 1}</span>
              </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Carousel;
