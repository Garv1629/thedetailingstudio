import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  Check,
  Copy,
  MapPin,
  Navigation,
  Phone,
} from 'lucide-react';
import { STUDIO_INFO } from '../data/atelierData';
import {
  buildGoogleMapsDirectionsUrl,
  computeMagneticOffset,
  computeSpecularCoordinates,
} from '../utils/luxuryMotionLogic';

export function AtelierCredentialsSection() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [copiedPlusCode, setCopiedPlusCode] = useState(false);
  const [locationSpecular, setLocationSpecular] = useState(false);

  const locationCardRef = useRef<HTMLDivElement | null>(null);
  const directionsCtaRef = useRef<HTMLAnchorElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const directionsUrl = buildGoogleMapsDirectionsUrl(
    `${STUDIO_INFO.brandName}, ${STUDIO_INFO.address}`,
  );

  const handleTrackSpecular = (event: PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || event.pointerType !== 'mouse') return;
    const node = locationCardRef.current;
    if (!node) return;
    const { xPct, yPct } = computeSpecularCoordinates(
      event.clientX,
      event.clientY,
      node.getBoundingClientRect(),
    );
    node.style.setProperty('--mx', `${xPct}%`);
    node.style.setProperty('--my', `${yPct}%`);
    if (!locationSpecular) {
      setLocationSpecular(true);
    }
  };

  const handleDirectionsMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (prefersReducedMotion || event.pointerType !== 'mouse') return;
    const node = directionsCtaRef.current;
    if (!node) return;
    const { x, y } = computeMagneticOffset(
      event.clientX,
      event.clientY,
      node.getBoundingClientRect(),
      5,
      prefersReducedMotion,
    );
    node.style.setProperty('--mag-x', `${x}px`);
    node.style.setProperty('--mag-y', `${y}px`);
  };

  const resetDirectionsOffset = () => {
    const node = directionsCtaRef.current;
    if (!node) return;
    node.style.setProperty('--mag-x', '0px');
    node.style.setProperty('--mag-y', '0px');
  };

  const handleCopyPlusCode = async () => {
    try {
      await navigator.clipboard.writeText(STUDIO_INFO.plusCode);
    } catch {
      // Gracefully continue if clipboard permission is unavailable
    }
    setCopiedPlusCode(true);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      copyTimerRef.current = null;
      setCopiedPlusCode(false);
    }, 2200);
  };

  return (
    <section
      id="studio"
      aria-label="Greater Noida studio location and directions"
      className="relative z-10 pt-14 sm:pt-20 lg:pt-32 pb-12 sm:pb-16 lg:pb-24 px-4 sm:px-8 lg:px-16 lg:pr-20 scroll-mt-20 lg:scroll-mt-4"
    >
      <div className="mx-auto w-full max-w-[1220px]">
        {/* Flagship Horizontal Smoked-Obsidian Showroom Monolith */}
        <div
          ref={locationCardRef}
          onPointerMove={handleTrackSpecular}
          onPointerLeave={() => setLocationSpecular(false)}
          data-testid="studio-directions-card"
          className="relative glass-surface-elevated rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch"
        >
          {/* Pointer-reactive specular border & surface reflection */}
          <div
            aria-hidden="true"
            className={`service-glass-specular-border pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 ${locationSpecular && !prefersReducedMotion
                ? 'opacity-100'
                : 'opacity-0'
              }`}
          />
          <div
            aria-hidden="true"
            className={`service-glass-specular-sheen pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 ${locationSpecular && !prefersReducedMotion
                ? 'opacity-100'
                : 'opacity-0'
              }`}
          />
          {/* Top champagne architectural catchlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 8%, rgba(230, 198, 146, 0.58) 50%, transparent 92%)',
            }}
          />

          {/* Left 7 Columns: Exact Live Google Maps Embed for THE DETAILING STUDIO GREATER NOIDA */}
          <div className="group relative z-10 lg:col-span-7 overflow-hidden bg-[#070709] border-b lg:border-b-0 lg:border-r border-[#ECE8DF]/14 min-h-[260px] sm:min-h-[360px] lg:min-h-[450px]">
            <iframe
              title="THE DETAILING STUDIO GREATER NOIDA — Exact Studio Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d112204.9949766371!2d77.37099319726559!3d28.497427400000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ceb724aafb68f%3A0x3b07d21df20a0e33!2sTHE%20DETAILING%20STUDIO%20GREATER%20NOIDA!5e0!3m2!1sen!2sin!4v1795775203580!5m2!1sen!2sin"
              className="studio-map-iframe absolute inset-0 h-full w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />

            {/* Subtle champagne edge vignette so the map integrates seamlessly */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#E6C692]/15"
            />

            {/* Direct Google Maps external link button */}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open The Detailing Studio Greater Noida in Google Maps"
              className="absolute top-3.5 right-3.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#060607]/88 backdrop-blur-md border border-[#E6C692]/35 px-3.5 py-1.5 font-mono-atelier text-[10.5px] text-[#ECE8DF] shadow-[0_8px_22px_rgba(0,0,0,0.55)] transition-colors hover:border-[#E6C692] hover:text-[#E6C692]"
            >
              <Navigation className="w-3 h-3 text-[#E6C692]" aria-hidden="true" />
              <span>Open in Google Maps</span>
            </a>
          </div>

          {/* Right 5 Columns: Private Showroom Arrival & Sculpted Get Directions CTA */}
          <div className="relative z-10 lg:col-span-5 p-5 sm:p-8 lg:p-9 flex flex-col justify-between gap-5 sm:gap-7">
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 sm:gap-3">
                <p className="font-mono-atelier text-[11px] tracking-[0.16em] text-[#E6C692]">
                  Private Detailing Bay
                </p>
                <span className="font-mono-atelier text-xs text-[#C9C5BC] tabular-nums">
                  {STUDIO_INFO.rating} ★ · {STUDIO_INFO.reviewCount} reviews
                </span>
              </div>

              <h2 className="mt-2 font-editorial text-[clamp(1.65rem,6vw,2.125rem)] font-medium tracking-[-0.01em] text-[#ECE8DF] leading-[1.08]">
                Visit the Studio
              </h2>

              <div className="mt-5 flex items-start gap-2.5 text-sm leading-relaxed text-[#ECE8DF]">
                <MapPin
                  className="w-4 h-4 text-[#E6C692] shrink-0 mt-1"
                  aria-hidden="true"
                />
                <span>{STUDIO_INFO.address}</span>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4 pt-5 border-t border-[#ECE8DF]/12">
                <div>
                  <dt className="font-mono-atelier text-[10px] tracking-[0.12em] text-[#A6A299]">
                    Studio Hours
                  </dt>
                  <dd className="mt-1 text-xs sm:text-[13px] font-medium text-[#ECE8DF]">
                    Daily · 9:00 AM – 8:00 PM
                  </dd>
                </div>
                <div>
                  <dt className="font-mono-atelier text-[10px] tracking-[0.12em] text-[#A6A299]">
                    Direct Desk
                  </dt>
                  <dd className="mt-1 font-mono-atelier text-xs sm:text-[13px] font-medium text-[#ECE8DF]">
                    {STUDIO_INFO.phoneDisplay}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-center justify-between gap-3 pt-5 border-t border-[#ECE8DF]/12 text-xs text-[#C9C5BC]">
                <span>Enclosed private bay · Pickup &amp; drop available</span>
                <button
                  type="button"
                  onClick={handleCopyPlusCode}
                  className="inline-flex items-center gap-1.5 font-mono-atelier text-xs text-[#ECE8DF] hover:text-[#E6C692] transition-colors shrink-0 cursor-pointer py-1"
                  aria-label="Copy Greater Noida studio Plus Code FGWF+X9"
                >
                  {copiedPlusCode ? (
                    <>
                      <Check
                        className="w-3.5 h-3.5 text-[#E6C692]"
                        aria-hidden="true"
                      />
                      <span className="text-[#E6C692]">Copied FGWF+X9</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      <span>FGWF+X9</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ultra-Premium Get Directions Primary Action + Direct Call */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <a
                ref={directionsCtaRef}
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onPointerMove={handleDirectionsMove}
                onPointerLeave={resetDirectionsOffset}
                onBlur={resetDirectionsOffset}
                className="luxury-directions-cta group flex-1 inline-flex items-center justify-between gap-3 rounded-full pl-5 pr-2 py-2 text-[#060607] min-h-[52px] whitespace-nowrap"
              >
                <span className="flex flex-col leading-none text-left">
                  <span className="font-display-wide text-[13.5px] font-semibold tracking-[0.01em] text-[#060607]">
                    Get Directions
                  </span>
                  <span className="mt-0.5 font-mono-atelier text-[9.5px] tracking-[0.08em] text-[#060607] opacity-75">
                    Zeta I · Plot No 204
                  </span>
                </span>

                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#060607] text-[#E6C692] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
                  <ArrowUpRight
                    className="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </span>
              </a>

              <a
                href={STUDIO_INFO.phoneHref}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ECE8DF]/24 bg-white/[0.04] px-5 py-3 text-xs sm:text-[13px] font-medium text-[#ECE8DF] hover:border-[#ECE8DF]/45 hover:bg-white/[0.1] transition-colors min-h-[52px] whitespace-nowrap"
              >
                <Phone className="w-3.5 h-3.5 text-[#E6C692]" aria-hidden="true" />
                <span>Call Studio</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
