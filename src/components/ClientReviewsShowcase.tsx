import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { STUDIO_REVIEWS } from '../data/atelierData';
import {
  getNextReviewIndex,
  getPrevReviewIndex,
} from '../utils/editorialShowcaseLogic';

export function ClientReviewsShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageErrorId, setImageErrorId] = useState<string | null>(null);
  const total = STUDIO_REVIEWS.length;
  const activeReview = STUDIO_REVIEWS[activeIndex] ?? STUDIO_REVIEWS[0];

  const handlePrev = () => {
    setActiveIndex((idx) => getPrevReviewIndex(idx, total));
  };

  const handleNext = () => {
    setActiveIndex((idx) => getNextReviewIndex(idx, total));
  };

  const progressWidthPct = ((activeIndex + 1) / Math.max(1, total)) * 100;

  return (
    <div
      id="reviews"
      aria-label="Client testimonials and studio results"
      className="mt-14 sm:mt-20 lg:mt-28 pt-10 sm:pt-14 border-t border-[#ECE8DF]/12"
    >
      {/* Clean Editorial Section Heading */}
      <div className="mb-7 sm:mb-10">
        <h3 className="font-editorial text-[clamp(1.85rem,7vw,3.15rem)] font-normal tracking-[-0.015em] text-[#ECE8DF] leading-[1.06]">
          Trusted by collectors &amp; daily drivers.
        </h3>
      </div>

      {/* Asymmetric Split Luxury Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-stretch">
        {/* Left 5 Columns: Ultra-Premium Champagne-Beveled Editorial Review Card */}
        <article
          aria-live="polite"
          data-testid="active-review-card"
          className="review-wet-glass-card relative lg:col-span-5 rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 lg:p-10 overflow-hidden flex flex-col justify-between min-h-0 lg:min-h-[450px]"
        >
          {/* Precision double-hairline inner frame */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[10px] rounded-[20px] border border-[#E6C692]/[0.11]"
          />

          {/* Top champagne architectural catchlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 6%, rgba(230, 198, 146, 0.72) 38%, rgba(255, 246, 224, 0.45) 58%, transparent 94%)',
            }}
          />

          {/* Soft ambient corner sheen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(230, 198, 146, 0.14) 0%, rgba(230, 198, 146, 0.03) 45%, transparent 72%)',
            }}
          />

          <div className="relative z-10">
            {/* Top Motif Row: Sculptural Serif Quote + Five-Star Gold Constellation */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span
                  aria-hidden="true"
                  className="block font-editorial text-[48px] sm:text-[64px] leading-[0.72] bg-gradient-to-b from-[#F8EAD0] via-[#E6C692] to-[#9E7C48] bg-clip-text text-transparent select-none"
                >
                  “
                </span>
                <span
                  aria-hidden="true"
                  className="mt-1 h-px w-10 bg-gradient-to-r from-[#E6C692]/60 to-transparent"
                />
              </div>

              <div
                aria-label="Rated 5 out of 5 stars"
                className="flex items-center gap-1 pt-1.5"
              >
                {Array.from({ length: 5 }).map((_, starIdx) => (
                  <Star
                    key={starIdx}
                    className="w-3.5 h-3.5 fill-[#E6C692] text-[#E6C692] drop-shadow-[0_0_8px_rgba(230,198,146,0.35)]"
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>

            <h4 className="mt-5 font-editorial text-[25px] sm:text-[28px] font-medium leading-[1.18] tracking-[-0.01em] text-[#ECE8DF]">
              {activeReview.headline}
            </h4>

            <p className="mt-5 text-[14.5px] sm:text-[15.5px] leading-[1.74] text-[#ECE8DF]">
              {activeReview.quote}
            </p>

            <p className="mt-4 text-[13.5px] leading-[1.72] text-[#A6A299]">
              {activeReview.secondaryQuote}
            </p>
          </div>

          {/* Refined Author Signature Footer */}
          <footer className="relative z-10 mt-9 pt-6 border-t border-[#E6C692]/18 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display-wide text-[15px] font-semibold tracking-[0.01em] text-[#ECE8DF]">
                {activeReview.author}
              </p>
              <p className="mt-1 font-mono-atelier text-[11px] tracking-[0.04em] text-[#E6C692]">
                {activeReview.meta}
              </p>
            </div>

            {/* Brushed-Champagne Double-Ring Monogram Crest */}
            <div
              aria-hidden="true"
              className="relative shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full p-[1.5px] shadow-[0_10px_24px_rgba(0,0,0,0.65),0_0_20px_rgba(230,198,146,0.16)]"
              style={{
                background:
                  'linear-gradient(140deg, #F7E8CB 0%, #CFA76A 48%, #594426 100%)',
              }}
            >
              <span className="inline-flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-[#1F1B14] via-[#11100E] to-[#08080A] font-mono-atelier text-[11.5px] font-semibold tracking-[0.08em] text-[#E6C692]">
                {activeReview.initials}
              </span>
            </div>
          </footer>
        </article>

        {/* Right 7 Columns: Clean Champagne-Gold Framed Studio Vehicle Showcase */}
        <div className="lg:col-span-7 flex">
          <div className="review-gold-frame relative w-full rounded-[24px] sm:rounded-[28px] overflow-hidden aspect-[16/10] lg:aspect-auto lg:min-h-[450px] bg-[#08080A]">
            {imageErrorId !== activeReview.id ? (
              <img
                key={activeReview.id}
                src={activeReview.showcaseImage}
                alt={activeReview.showcaseAlt}
                referrerPolicy="no-referrer"
                onError={() => setImageErrorId(activeReview.id)}
                className="h-full w-full object-cover object-left scale-[1.06] transition-opacity duration-500"
              />
            ) : (
              <div
                aria-label={activeReview.showcaseAlt}
                className="flex h-full w-full items-center justify-center bg-[#08080A] px-6 text-center font-mono-atelier text-xs text-[#A6A299]"
              >
                {activeReview.serviceTag}
              </div>
            )}

            {/* Subtle edge contrast vignette & golden floor catchlight */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(6,6,7,0.14) 0%, rgba(6,6,7,0.02) 52%, rgba(6,6,7,0.54) 100%)',
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 bottom-0 h-[2px]"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(240, 212, 160, 0.92) 50%, transparent 100%)',
              }}
            />

            {/* Pure Glowing Champagne Carousel Dots */}
            <div className="absolute right-6 bottom-5">
              <div
                role="tablist"
                aria-label="Select client review"
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    handleNext();
                  } else if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    handlePrev();
                  }
                }}
                className="flex items-center gap-2.5"
              >
                {STUDIO_REVIEWS.map((rev, idx) => {
                  const isCurrent = idx === activeIndex;
                  return (
                    <button
                      key={rev.id}
                      type="button"
                      role="tab"
                      aria-selected={isCurrent}
                      aria-label={`View review by ${rev.author}`}
                      onClick={() => setActiveIndex(idx)}
                      className="inline-flex items-center justify-center p-1 text-xs text-[#ECE8DF] cursor-pointer"
                    >
                      <span
                        aria-hidden="true"
                        className={`block rounded-full transition-all duration-300 ${isCurrent
                            ? 'w-3.5 h-3.5 bg-[#E6C692] shadow-[0_0_16px_rgba(230,198,146,0.95)]'
                            : 'w-2 h-2 bg-[#E6C692]/45 hover:bg-[#E6C692]/80'
                          }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Centered Champagne Hairline Indicator + Quiet Prev/Next Controls */}
      <div className="mt-8 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous client review"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#ECE8DF]/25 bg-white/[0.05] text-xs text-[#ECE8DF] hover:border-[#E6C692]/60 hover:text-[#E6C692] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="relative h-[2px] w-28 sm:w-36 overflow-hidden rounded-full bg-[#ECE8DF]/15"
          >
            <div
              className="h-full bg-gradient-to-r from-[#C8A66B] via-[#E6C692] to-[#F7E7C8] transition-all duration-300"
              style={{ width: `${progressWidthPct}%` }}
            />
          </div>
          <span className="font-mono-atelier text-[11px] text-[#A6A299] tabular-nums">
            0{activeIndex + 1} / 0{total}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next client review"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#ECE8DF]/25 bg-white/[0.05] text-xs text-[#ECE8DF] hover:border-[#E6C692]/60 hover:text-[#E6C692] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
