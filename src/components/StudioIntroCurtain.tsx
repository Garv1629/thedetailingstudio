import { useEffect, useState } from 'react';
import { STUDIO_INFO } from '../data/atelierData';
import { shouldSkipIntroCurtain } from '../utils/luxuryMotionLogic';

type CurtainPhase = 'entering' | 'lifting' | 'done';

export function StudioIntroCurtain() {
  const [phase, setPhase] = useState<CurtainPhase>(() => {
    if (typeof window === 'undefined') return 'done';
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    return shouldSkipIntroCurtain(prefersReduced, window.location.search)
      ? 'done'
      : 'entering';
  });

  useEffect(() => {
    if (phase === 'done') return;

    const liftTimer = window.setTimeout(() => {
      setPhase('lifting');
    }, 520);

    const doneTimer = window.setTimeout(() => {
      setPhase('done');
    }, 1180);

    return () => {
      window.clearTimeout(liftTimer);
      window.clearTimeout(doneTimer);
    };
    // Run timers strictly once on mount when curtain begins in 'entering' phase
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'done') return null;

  const isLifting = phase === 'lifting';

  return (
    <div
      data-testid="studio-intro-curtain"
      aria-hidden="true"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060607] pointer-events-none select-none transition-[transform,opacity] duration-[640ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isLifting
          ? '-translate-y-full opacity-95'
          : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <span className="font-editorial text-lg sm:text-xl font-medium tracking-[0.2em] text-[#ECE8DF]">
          {STUDIO_INFO.brandName}
        </span>

        <div className="relative h-px w-40 sm:w-52 overflow-hidden bg-[#ECE8DF]/15">
          <div className="studio-curtain-beam absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-[#ECE8DF] to-transparent" />
        </div>

        <span className="font-mono-atelier text-[11px] tracking-[0.22em] uppercase text-[#A6A299]">
          Zeta I · {STUDIO_INFO.city}
        </span>
      </div>
    </div>
  );
}
