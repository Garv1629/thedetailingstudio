import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Armchair,
  ArrowRight,
  Car,
  ChevronDown,
  Droplets,
  Shield,
  Sparkles,
} from 'lucide-react';
import type {
  DetailingServiceCategory,
  ServiceCategoryIconKey,
} from '../data/servicesMenuData';
import { computeSpecularCoordinates } from '../utils/luxuryMotionLogic';
import {
  CARD_REVEAL_OBSERVER_OPTIONS,
  getCardRevealMotion,
  resolveRevealState,
  shouldRevealImmediately,
} from '../utils/scrollRevealLogic';

interface FloatingServiceCardProps {
  category: DetailingServiceCategory;
  isExpanded: boolean;
  selectedServiceId: string | null;
  onToggleCategory: () => void;
  onToggleService: (serviceId: string) => void;
  disableSelfReveal?: boolean;
  className?: string;
}

const LUXURY_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function CategoryIcon({ icon }: { icon: ServiceCategoryIconKey }) {
  const iconClass = 'w-[15px] h-[15px] stroke-[1.65]';
  switch (icon) {
    case 'droplets':
      return <Droplets className={iconClass} aria-hidden="true" />;
    case 'armchair':
      return <Armchair className={iconClass} aria-hidden="true" />;
    case 'car':
      return <Car className={iconClass} aria-hidden="true" />;
    case 'sparkles':
      return <Sparkles className={iconClass} aria-hidden="true" />;
    case 'shield':
      return <Shield className={iconClass} aria-hidden="true" />;
  }
}

export function FloatingServiceCard({
  category,
  isExpanded,
  selectedServiceId,
  onToggleCategory,
  onToggleService,
  disableSelfReveal = false,
  className = '',
}: FloatingServiceCardProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const cardRef = useRef<HTMLDivElement | null>(null);
  const triggerShellRef = useRef<HTMLDivElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(
    disableSelfReveal || prefersReducedMotion,
  );
  const [specularActive, setSpecularActive] = useState(false);
  const triggerId = `floating-service-trigger-${category.id}`;
  const panelId = `floating-service-panel-${category.id}`;

  useEffect(() => {
    if (disableSelfReveal || isRevealed) return;

    const prefersReduced =
      prefersReducedMotion ||
      (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    if (
      shouldRevealImmediately(
        prefersReduced,
        typeof IntersectionObserver !== 'undefined',
      )
    ) {
      setIsRevealed(true);
      return;
    }

    const node = cardRef.current;
    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (resolveRevealState(false, entry.isIntersecting, prefersReduced)) {
          setIsRevealed(true);
          observer.disconnect();
          break;
        }
      }
    }, CARD_REVEAL_OBSERVER_OPTIONS);

    observer.observe(node);
    return () => observer.disconnect();
  }, [isRevealed, prefersReducedMotion]);

  const handleSpecularPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || event.pointerType !== 'mouse') return;
    const shell = triggerShellRef.current;
    if (!shell) return;

    const { xPct, yPct } = computeSpecularCoordinates(
      event.clientX,
      event.clientY,
      shell.getBoundingClientRect(),
    );
    shell.style.setProperty('--mx', `${xPct}%`);
    shell.style.setProperty('--my', `${yPct}%`);
    if (!specularActive) {
      setSpecularActive(true);
    }
  };

  const handleSpecularPointerLeave = () => {
    setSpecularActive(false);
  };

  const revealMotion = getCardRevealMotion(
    disableSelfReveal || isRevealed,
    disableSelfReveal || prefersReducedMotion,
  );

  return (
    <div
      ref={cardRef}
      data-testid={`service-category-${category.id}`}
      data-expanded={isExpanded ? 'true' : 'false'}
      data-revealed={revealMotion.revealed ? 'true' : 'false'}
      data-specular-active={specularActive ? 'true' : 'false'}
      onFocus={() => {
        if (!isRevealed) setIsRevealed(true);
      }}
      className={`relative w-full max-w-[360px] ${
        disableSelfReveal
          ? ''
          : prefersReducedMotion
            ? 'will-change-[opacity,transform] transition-none opacity-100 translate-y-0'
            : 'will-change-[opacity,transform] transition-[opacity,transform] duration-[760ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0'
      } ${
        disableSelfReveal
          ? ''
          : revealMotion.revealed
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-7'
      } ${isExpanded ? 'z-30' : 'z-10'} ${className}`}
    >
      {/* Compact Floating Glass Category Trigger */}
      <motion.div
        ref={triggerShellRef}
        onPointerMove={handleSpecularPointerMove}
        onPointerLeave={handleSpecularPointerLeave}
        whileHover={
          prefersReducedMotion ? undefined : { y: -1.5, scale: 1.008 }
        }
        whileTap={prefersReducedMotion ? undefined : { scale: 0.992 }}
        transition={{ duration: 0.28, ease: LUXURY_EASE }}
        className={`relative rounded-2xl overflow-hidden ${
          isExpanded ? 'service-glass-card-active' : 'service-glass-card'
        }`}
      >
        {/* Pointer-reactive specular border catchlight */}
        <div
          aria-hidden="true"
          className={`service-glass-specular-border pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 ${
            specularActive && !prefersReducedMotion
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        />

        {/* Pointer-reactive soft glass surface sheen */}
        <div
          aria-hidden="true"
          className={`service-glass-specular-sheen pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 ${
            specularActive && !prefersReducedMotion
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        />

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-px transition-opacity duration-500 ${
            isExpanded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background:
              'linear-gradient(90deg, transparent 6%, rgba(236, 232, 223, 0.56) 50%, transparent 94%)',
          }}
        />

        <button
          id={triggerId}
          type="button"
          aria-expanded={isExpanded}
          aria-controls={panelId}
          onClick={onToggleCategory}
          className="group w-full flex items-center justify-between gap-3.5 px-4 sm:px-5 py-3.5 min-h-[58px] text-left text-xs text-[#ECE8DF] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#ECE8DF]"
        >
          <span className="flex items-center gap-3 min-w-0">
            <span
              className={`inline-flex items-center justify-center w-8 h-8 rounded-full border shrink-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isExpanded
                  ? 'border-[#ECE8DF]/38 bg-[#ECE8DF]/[0.12] text-[#ECE8DF]'
                  : 'border-[#ECE8DF]/16 bg-white/[0.04] text-[#C9C5BC] group-hover:border-[#ECE8DF]/30 group-hover:text-[#ECE8DF]'
              }`}
            >
              <CategoryIcon icon={category.icon} />
            </span>

            <span className="flex items-baseline gap-2.5 min-w-0">
              <span className="font-mono-atelier text-[10px] tracking-[0.16em] text-[#A6A299] shrink-0">
                {category.index}
              </span>
              <span className="font-sans-atelier text-[12.5px] sm:text-[13.5px] font-semibold tracking-[0.12em] uppercase text-[#ECE8DF] leading-snug">
                {category.title}
              </span>
            </span>
          </span>

          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full border shrink-0 transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isExpanded
                ? 'border-[#ECE8DF]/32 bg-[#ECE8DF]/[0.10] text-[#ECE8DF]'
                : 'border-[#ECE8DF]/14 text-[#A6A299] group-hover:border-[#ECE8DF]/28 group-hover:text-[#ECE8DF]'
            }`}
          >
            <ChevronDown
              aria-hidden="true"
              className={`w-4 h-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isExpanded ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </span>
        </button>
      </motion.div>

      {/* Anchored Dropdown Panel (overlay on desktop for zero scroll jump; safe in-flow on mobile) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={triggerId}
            key="floating-dropdown"
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, y: -6, height: 0 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, height: 'auto' }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -6, height: 0 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.01 : 0.44,
              ease: LUXURY_EASE,
            }}
            className="mt-2.5 md:mt-0 md:absolute md:top-[calc(100%+10px)] md:left-0 md:right-0 md:z-30 overflow-hidden rounded-2xl service-glass-card-active bg-[#070709]/80"
          >
            <div className="px-4 sm:px-5 py-2.5 max-h-[68vh] md:max-h-[430px] overflow-y-auto">
              <ul className="divide-y divide-[#ECE8DF]/[0.08]">
                {category.services.map((service, index) => {
                  const isSelected = selectedServiceId === service.id;
                  const detailId = `service-detail-${service.id}`;

                  return (
                    <motion.li
                      key={service.id}
                      initial={
                        prefersReducedMotion
                          ? { opacity: 1 }
                          : { opacity: 0, y: 6 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: prefersReducedMotion ? 0.01 : 0.34,
                        delay: prefersReducedMotion ? 0 : 0.05 + index * 0.08,
                        ease: LUXURY_EASE,
                      }}
                      className="relative"
                    >
                      <button
                        type="button"
                        aria-expanded={isSelected}
                        aria-controls={detailId}
                        onClick={() => onToggleService(service.id)}
                        className={`group relative w-full flex items-center justify-between gap-3 py-3.5 px-2 text-left min-h-[48px] cursor-pointer overflow-hidden rounded-lg transition-colors duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isSelected
                            ? 'bg-[#ECE8DF]/[0.085]'
                            : 'hover:bg-[#ECE8DF]/[0.045]'
                        }`}
                      >
                        {/* Soft hover / active glow */}
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            isSelected
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-100'
                          }`}
                          style={{
                            background:
                              'radial-gradient(70% 130% at 10% 50%, rgba(236, 232, 223, 0.09), transparent 74%)',
                          }}
                        />

                        {/* Thin gradient highlight hairline */}
                        <span
                          aria-hidden="true"
                          className={`service-row-highlight pointer-events-none absolute left-0 right-0 bottom-0 h-px origin-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            isSelected
                              ? 'opacity-100 scale-x-100'
                              : 'opacity-0 scale-x-75 group-hover:opacity-85 group-hover:scale-x-100'
                          }`}
                        />

                        {/* Service label with subtle rightward hover shift */}
                        <span
                          className={`relative z-10 flex items-center gap-2.5 min-w-0 transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            isSelected
                              ? 'translate-x-1.5'
                              : 'sm:group-hover:translate-x-1.5'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`h-3 w-[1.5px] rounded-full transition-all duration-250 ${
                              isSelected
                                ? 'bg-[#ECE8DF] opacity-100'
                                : 'bg-[#ECE8DF]/45 opacity-0 group-hover:opacity-100'
                            }`}
                          />
                          <span
                            className={`text-[14px] leading-snug transition-colors duration-250 ${
                              isSelected
                                ? 'text-[#ECE8DF] font-medium'
                                : 'text-[#C9C5BC] group-hover:text-[#ECE8DF]'
                            }`}
                          >
                            {service.name}
                          </span>
                        </span>

                        {/* Minimal forward-gliding arrow */}
                        <ArrowRight
                          aria-hidden="true"
                          className={`relative z-10 w-3.5 h-3.5 shrink-0 transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            isSelected
                              ? 'text-[#ECE8DF] rotate-90'
                              : 'text-[#A6A299] group-hover:text-[#ECE8DF] group-hover:translate-x-1'
                          }`}
                        />
                      </button>

                      {/* Smooth Inline Service Detail Area */}
                      <AnimatePresence initial={false}>
                        {isSelected && (
                          <motion.div
                            id={detailId}
                            key={`detail-${service.id}`}
                            data-testid={`service-detail-${service.id}`}
                            initial={
                              prefersReducedMotion
                                ? { opacity: 1 }
                                : { height: 0, opacity: 0 }
                            }
                            animate={
                              prefersReducedMotion
                                ? { opacity: 1 }
                                : { height: 'auto', opacity: 1 }
                            }
                            exit={
                              prefersReducedMotion
                                ? { opacity: 0 }
                                : { height: 0, opacity: 0 }
                            }
                            transition={{
                              duration: prefersReducedMotion ? 0.01 : 0.34,
                              ease: LUXURY_EASE,
                            }}
                            className="overflow-hidden"
                          >
                            <div className="pl-3.5 pr-2 pb-4 pt-2">
                              <div className="border-l border-[#ECE8DF]/25 pl-3.5 space-y-3">
                                <p className="text-[13px] leading-relaxed text-[#C9C5BC]">
                                  {service.description}
                                </p>

                                <dl className="grid grid-cols-2 gap-3 pt-0.5">
                                  <div>
                                    <dt className="font-mono-atelier text-[9.5px] uppercase tracking-[0.14em] text-[#A6A299]">
                                      Pricing
                                    </dt>
                                    <dd className="mt-0.5 font-mono-atelier text-[11.5px] text-[#ECE8DF]">
                                      {service.pricePlaceholder}
                                    </dd>
                                  </div>

                                  <div>
                                    <dt className="font-mono-atelier text-[9.5px] uppercase tracking-[0.14em] text-[#A6A299]">
                                      Duration
                                    </dt>
                                    <dd className="mt-0.5 font-mono-atelier text-[11.5px] text-[#C9C5BC]">
                                      {service.durationPlaceholder}
                                    </dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
