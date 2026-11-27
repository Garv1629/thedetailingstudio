import { useEffect, useRef } from 'react';
import type { SectionId } from '../data/atelierData';

interface StudioBackdropProps {
  activeSection: SectionId;
}

/**
 * Pure obsidian architectural backdrop for lower studio sections (Marquee, Visit the Studio,
 * Packages & Footer). All automotive background visuals come exclusively from the user's
 * two scroll-driven FFmpeg video sequences — zero static background photos.
 */
export function StudioBackdrop({ activeSection }: StudioBackdropProps) {
  const sheenRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sheen = sheenRef.current;
    if (!sheen) return;
    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let rafId: number | null = null;
    let nextX = 50;
    let nextY = 35;

    const commitPosition = () => {
      rafId = null;
      sheen.style.setProperty('--backdrop-px', `${nextX}%`);
      sheen.style.setProperty('--backdrop-py', `${nextY}%`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      nextX = (event.clientX / Math.max(window.innerWidth, 1)) * 100;
      nextY = (event.clientY / Math.max(window.innerHeight, 1)) * 100;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(commitPosition);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden bg-[#060607] pointer-events-none select-none"
      data-testid="studio-backdrop"
      data-active-section={activeSection}
    >
      {/* Subtle Architectural Overhead Ambient Light */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 72% 48% at 50% 0%, rgba(236, 232, 223, 0.065), rgba(6, 6, 7, 0) 70%)',
        }}
      />

      {/* Interactive Pointer Ambient Sheen */}
      <div
        ref={sheenRef}
        className="absolute inset-0 transition-opacity duration-500 opacity-20"
        style={{
          background:
            'radial-gradient(circle 40vw at var(--backdrop-px, 50%) var(--backdrop-py, 35%), rgba(255, 248, 235, 0.10), transparent 68%)',
        }}
      />

      {/* Subtle Architectural Micro-Grain Texture */}
      <div className="atelier-grain absolute inset-0 pointer-events-none" />
    </div>
  );
}
