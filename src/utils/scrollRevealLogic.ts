export const CARD_REVEAL_OFFSET_PX = 28;

export const CARD_REVEAL_OBSERVER_OPTIONS: IntersectionObserverInit = {
  threshold: 0.15,
  rootMargin: '0px 0px -8% 0px',
};

export interface CardRevealMotion {
  revealed: boolean;
  opacity: number;
  translateY: number;
}

export function shouldRevealImmediately(
  prefersReducedMotion: boolean,
  supportsIntersectionObserver: boolean,
): boolean {
  return prefersReducedMotion || !supportsIntersectionObserver;
}

export function resolveRevealState(
  alreadyRevealed: boolean,
  isIntersecting: boolean,
  prefersReducedMotion: boolean,
): boolean {
  if (prefersReducedMotion || alreadyRevealed) {
    return true;
  }
  return isIntersecting;
}

export function getCardRevealMotion(
  isRevealed: boolean,
  prefersReducedMotion: boolean,
): CardRevealMotion {
  const revealed = prefersReducedMotion || isRevealed;
  return {
    revealed,
    opacity: revealed ? 1 : 0,
    translateY: revealed ? 0 : CARD_REVEAL_OFFSET_PX,
  };
}

export type ServiceCrossfadePhase = 'entering' | 'active' | 'exiting';

export interface ServiceCrossfadeState {
  opacity: number;
  y: number;
  x: number;
  scale: number;
  blurPx: number;
  phase: ServiceCrossfadePhase;
}

export interface ServiceCrossfadeOptions {
  prefersReducedMotion?: boolean;
  /** Continuous blend [0..1] between collapsed (0) and expanded (1) thresholds */
  expandedBlend?: number;
}

/**
 * Calibrated luxury spring physics for Framer Motion `useSpring` on scroll progress:
 * fluid, critically damped glide with zero bounce or jitter.
 */
export const SERVICE_CROSSFADE_SPRING = {
  stiffness: 170,
  damping: 28,
  mass: 0.45,
} as const;

/**
 * Viewport scroll progress thresholds (`offset: ['start end', 'end start']`)
 * calibrated so an outgoing card (`0.62 -> 0.80`) naturally overlaps and cross-fades
 * with the incoming card (`0.08 -> 0.28`) across consecutive 115–125svh waypoints.
 */
export const SERVICE_CROSSFADE_THRESHOLDS = {
  collapsed: {
    enterStart: 0.08,
    enterEnd: 0.28,
    exitStart: 0.62,
    exitEnd: 0.8,
  },
  expanded: {
    enterStart: 0.04,
    enterEnd: 0.16,
    exitStart: 0.78,
    exitEnd: 0.92,
  },
} as const;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/** Smooth cubic Hermite ease-in-out between `edge0` and `edge1`. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Pure, deterministic viewport cross-fade kinematics for floating service cards.
 * - Entering: rises gently from below with subtle margin glide, depth scale, and soft rack-focus.
 * - Active: locked at full opacity (1), crisp `blurPx = 0`, whisper-light vertical parallax drift.
 * - Exiting: dissolves smoothly upward while receding slightly as the next card fades in.
 */
export function computeServiceCrossfadeState(
  rawProgress: number,
  align: 'left' | 'right',
  options: ServiceCrossfadeOptions = {},
): ServiceCrossfadeState {
  const prefersReducedMotion = Boolean(options.prefersReducedMotion);
  if (prefersReducedMotion) {
    return {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      blurPx: 0,
      phase: 'active',
    };
  }

  const progress = clamp01(rawProgress);
  const exp = clamp01(options.expandedBlend ?? 0);

  const enterStart = lerp(
    SERVICE_CROSSFADE_THRESHOLDS.collapsed.enterStart,
    SERVICE_CROSSFADE_THRESHOLDS.expanded.enterStart,
    exp,
  );
  const enterEnd = lerp(
    SERVICE_CROSSFADE_THRESHOLDS.collapsed.enterEnd,
    SERVICE_CROSSFADE_THRESHOLDS.expanded.enterEnd,
    exp,
  );
  const exitStart = lerp(
    SERVICE_CROSSFADE_THRESHOLDS.collapsed.exitStart,
    SERVICE_CROSSFADE_THRESHOLDS.expanded.exitStart,
    exp,
  );
  const exitEnd = lerp(
    SERVICE_CROSSFADE_THRESHOLDS.collapsed.exitEnd,
    SERVICE_CROSSFADE_THRESHOLDS.expanded.exitEnd,
    exp,
  );

  const dir = align === 'left' ? -1 : 1;
  const plateauDrift = lerp(8, 0, exp);

  if (progress < enterEnd) {
    const t = smoothstep(enterStart, enterEnd, progress);
    return {
      opacity: Number(t.toFixed(4)),
      y: Number(lerp(34, plateauDrift, t).toFixed(2)),
      x: Number(lerp(dir * 16, 0, t).toFixed(2)),
      scale: Number(lerp(0.964, 1, t).toFixed(4)),
      blurPx: Number(lerp(6, 0, t).toFixed(2)),
      phase: 'entering',
    };
  }

  if (progress <= exitStart) {
    const t =
      exitStart > enterEnd ? (progress - enterEnd) / (exitStart - enterEnd) : 0.5;
    return {
      opacity: 1,
      y: Number(lerp(plateauDrift, -plateauDrift, t).toFixed(2)),
      x: 0,
      scale: 1,
      blurPx: 0,
      phase: 'active',
    };
  }

  const t = smoothstep(exitStart, exitEnd, progress);
  return {
    opacity: Number((1 - t).toFixed(4)),
    y: Number(lerp(-plateauDrift, -32, t).toFixed(2)),
    x: Number(lerp(0, dir * 10, t).toFixed(2)),
    scale: Number(lerp(1, 0.968, t).toFixed(4)),
    blurPx: Number(lerp(0, 5.5, t).toFixed(2)),
    phase: 'exiting',
  };
}

/**
 * Returns `'none'` when the card is in optical focus so CSS `filter` never creates
 * an unnecessary stacking layer that could dampen child `backdrop-filter` glass blur.
 */
export function formatCrossfadeBlurFilter(blurPx: number): string {
  if (!Number.isFinite(blurPx) || blurPx < 0.08) {
    return 'none';
  }
  return `blur(${blurPx.toFixed(2)}px)`;
}
