import { useEffect, useRef } from 'react';

export function MarqueeBand() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      track.style.transform = 'translate3d(0px, 0, 0)';
      return;
    }

    let rafId: number | null = null;
    const syncTransform = () => {
      rafId = null;
      const shiftPx = -(window.scrollY * 0.24) % 920;
      track.style.transform = `translate3d(${shiftPx}px, 0, 0)`;
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(syncTransform);
    };

    syncTransform();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="relative z-10 py-8 sm:py-14 lg:py-20 overflow-hidden select-none pointer-events-none border-y border-[#ECE8DF]/16 bg-white/[0.03] backdrop-blur-md"
    >
      <div
        ref={trackRef}
        className="flex whitespace-nowrap will-change-transform font-editorial font-normal uppercase leading-none text-[clamp(2.4rem,9.5vw,9.5rem)] tracking-[0.04em]"
      >
        {[0, 1, 2].map((repeat) => (
          <span key={repeat} className="inline-flex items-center marquee-stroke pr-8">
            Inspect{' '}
            <span className="text-[#E6C692] px-5" style={{ WebkitTextStroke: '0px' }}>
              ·
            </span>{' '}
            <span className="italic normal-case tracking-[0.01em]">Correct</span>{' '}
            <span className="text-[#E6C692] px-5" style={{ WebkitTextStroke: '0px' }}>
              ·
            </span>{' '}
            Protect{' '}
            <span className="text-[#E6C692] px-5" style={{ WebkitTextStroke: '0px' }}>
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
