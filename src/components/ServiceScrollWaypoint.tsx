import { useEffect, useRef } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import type { DetailingServiceCategory } from '../data/servicesMenuData';
import type { SectionId } from '../data/atelierData';
import {
  computeServiceCrossfadeState,
  formatCrossfadeBlurFilter,
  SERVICE_CROSSFADE_SPRING,
} from '../utils/scrollRevealLogic';
import { FloatingServiceCard } from './FloatingServiceCard';

interface ServiceScrollWaypointProps {
  sectionId: SectionId;
  category: DetailingServiceCategory;
  align: 'left' | 'right';
  isExpanded: boolean;
  selectedServiceId: string | null;
  onToggleCategory: () => void;
  onToggleService: (serviceId: string) => void;
  minHeightClassName?: string;
}

const EXPAND_BLEND_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function ServiceScrollWaypoint({
  sectionId,
  category,
  align,
  isExpanded,
  selectedServiceId,
  onToggleCategory,
  onToggleService,
  minHeightClassName = 'min-h-[82vh] md:min-h-[96vh]',
}: ServiceScrollWaypointProps) {
  const isRight = align === 'right';
  const prefersReducedMotion = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement | null>(null);
  const crossfadeContainerRef = useRef<HTMLDivElement | null>(null);

  // Track section viewport transit with Framer Motion scroll-linked kinematics
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Smooth spring-damped progress for fluid, luxury inertia without bounce
  const smoothProgress = useSpring(scrollYProgress, SERVICE_CROSSFADE_SPRING);

  // Smoothly widen the full-clarity reading plateau whenever this card is expanded
  const expandedBlend = useMotionValue(isExpanded ? 1 : 0);

  useEffect(() => {
    const controls = animate(expandedBlend, isExpanded ? 1 : 0, {
      duration: prefersReducedMotion ? 0.01 : 0.38,
      ease: EXPAND_BLEND_EASE,
    });
    return () => controls.stop();
  }, [expandedBlend, isExpanded, prefersReducedMotion]);

  const opacity = useTransform(
    [smoothProgress, expandedBlend],
    ([progress, exp]) =>
      computeServiceCrossfadeState(progress as number, align, {
        prefersReducedMotion,
        expandedBlend: exp as number,
      }).opacity,
  );

  const y = useTransform([smoothProgress, expandedBlend], ([progress, exp]) =>
    computeServiceCrossfadeState(progress as number, align, {
      prefersReducedMotion,
      expandedBlend: exp as number,
    }).y,
  );

  const x = useTransform([smoothProgress, expandedBlend], ([progress, exp]) =>
    computeServiceCrossfadeState(progress as number, align, {
      prefersReducedMotion,
      expandedBlend: exp as number,
    }).x,
  );

  const scale = useTransform(
    [smoothProgress, expandedBlend],
    ([progress, exp]) =>
      computeServiceCrossfadeState(progress as number, align, {
        prefersReducedMotion,
        expandedBlend: exp as number,
      }).scale,
  );

  const filter = useTransform(
    [smoothProgress, expandedBlend],
    ([progress, exp]) =>
      formatCrossfadeBlurFilter(
        computeServiceCrossfadeState(progress as number, align, {
          prefersReducedMotion,
          expandedBlend: exp as number,
        }).blurPx,
      ),
  );

  // Sync lightweight DOM data attributes directly off the MotionValue (zero React re-renders)
  useEffect(() => {
    const syncAttributes = () => {
      const node = crossfadeContainerRef.current;
      if (!node) return;
      const state = computeServiceCrossfadeState(smoothProgress.get(), align, {
        prefersReducedMotion,
        expandedBlend: expandedBlend.get(),
      });
      if (node.dataset.crossfadePhase !== state.phase) {
        node.dataset.crossfadePhase = state.phase;
      }
      node.dataset.crossfadeOpacity = state.opacity.toFixed(2);
    };

    syncAttributes();
    const unsubProgress = smoothProgress.on('change', syncAttributes);
    const unsubExpanded = expandedBlend.on('change', syncAttributes);
    return () => {
      unsubProgress();
      unsubExpanded();
    };
  }, [align, expandedBlend, prefersReducedMotion, smoothProgress]);

  return (
    <section
      ref={sectionRef}
      id={sectionId}
      aria-label={`${category.title} studio discipline`}
      className={`relative z-10 ${minHeightClassName} flex flex-col justify-start pt-5 sm:pt-8 pb-8 sm:pb-10 lg:pt-[22vh] lg:pb-32 px-4 sm:px-8 lg:px-16 lg:pr-20 scroll-mt-[295px] sm:scroll-mt-[330px] md:scroll-mt-[510px] lg:scroll-mt-0`}
    >
      <div className="mx-auto w-full max-w-[1320px]">
        <div
          className={`flex flex-col ${
            isRight ? 'lg:items-end' : 'lg:items-start'
          }`}
        >
          <motion.div
            ref={crossfadeContainerRef}
            data-crossfade-phase="active"
            data-crossfade-opacity="1.00"
            style={
              prefersReducedMotion
                ? undefined
                : {
                    opacity,
                    x,
                    y,
                    scale,
                    filter,
                    transformOrigin: isRight ? 'right center' : 'left center',
                  }
            }
            className="w-full max-w-full sm:max-w-[420px] lg:max-w-[360px] will-change-[opacity,transform,filter]"
          >
            <FloatingServiceCard
              category={category}
              isExpanded={isExpanded}
              selectedServiceId={selectedServiceId}
              onToggleCategory={onToggleCategory}
              onToggleService={onToggleService}
              disableSelfReveal
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
