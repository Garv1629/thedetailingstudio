import { useEffect, useRef, useState } from 'react';
import {
  computeTouchOffsetPosition,
  isInteractiveElementDescriptor,
  shouldYieldToNativeCursor,
  stepCursorPhysics,
  type CursorPhysicsState,
} from '../utils/porscheCursorLogic';

interface TapRipple {
  id: number;
  x: number;
  y: number;
}

const CURSOR_SPRITE_SRC = '/assets/detailing/porsche-cursor.png';
const TOUCH_IDLE_HIDE_MS = 1650;

function inspectElementTree(target: EventTarget | null): {
  interactive: boolean;
  yieldNative: boolean;
} {
  let node = target instanceof Element ? target : null;
  let interactive = false;
  let yieldNative = false;

  for (let depth = 0; depth < 6 && node; depth += 1) {
    const inputType =
      node instanceof HTMLInputElement ? node.type : null;
    if (
      shouldYieldToNativeCursor({
        tagName: node.tagName,
        type: inputType,
      })
    ) {
      yieldNative = true;
    }
    if (
      isInteractiveElementDescriptor({
        tagName: node.tagName,
        role: node.getAttribute('role'),
        type: inputType,
      })
    ) {
      interactive = true;
    }
    node = node.parentElement;
  }

  return { interactive, yieldNative };
}

export function PorscheCursor() {
  const carLayerRef = useRef<HTMLDivElement | null>(null);
  const spriteWrapperRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  const [ripples, setRipples] = useState<TapRipple[]>([]);
  const [spriteFailed, setSpriteFailed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const isFinePointer = window.matchMedia(
      '(hover: hover) and (pointer: fine)',
    ).matches;

    const physics: CursorPhysicsState = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      vx: 0,
      vy: 0,
      facing: 1,
      tiltDeg: 0,
    };

    const target = {
      x: physics.x,
      y: physics.y,
      dotX: physics.x,
      dotY: physics.y,
    };

    let visible = false;
    let interactiveHover = false;
    let pressed = false;
    let isTouchMode = !isFinePointer;
    let yieldedToNative = false;
    let rafId: number | null = null;
    let lastTimestamp = performance.now();
    let touchHideTimer: number | null = null;
    let rippleCounter = 0;
    const rippleTimers = new Set<number>();

    const syncBodyCursorClass = () => {
      if (isFinePointer && visible && !isTouchMode && !yieldedToNative) {
        document.body.classList.add('porsche-cursor-active');
      } else {
        document.body.classList.remove('porsche-cursor-active');
      }
    };

    const emitRipple = (x: number, y: number) => {
      if (prefersReducedMotion) return;
      const id = ++rippleCounter;
      setRipples((prev) => [...prev.slice(-4), { id, x, y }]);
      const timerId = window.setTimeout(() => {
        rippleTimers.delete(timerId);
        setRipples((prev) => prev.filter((item) => item.id !== id));
      }, 620);
      rippleTimers.add(timerId);
    };

    const applyVisuals = () => {
      const layer = carLayerRef.current;
      const spriteWrap = spriteWrapperRef.current;
      const dot = dotRef.current;
      if (!layer || !spriteWrap || !dot) return;

      const showCar = visible && !yieldedToNative;
      layer.style.opacity = showCar ? '1' : '0';
      layer.style.transform = `translate3d(${physics.x.toFixed(2)}px, ${physics.y.toFixed(2)}px, 0)`;

      const scaleFactor = pressed ? 0.9 : interactiveHover ? 1.13 : 1;
      spriteWrap.style.transform = `translate(-50%, -50%) scaleX(${physics.facing}) rotate(${physics.tiltDeg.toFixed(2)}deg) scale(${scaleFactor})`;
      spriteWrap.dataset.interactive = interactiveHover ? 'true' : 'false';
      spriteWrap.dataset.pressed = pressed ? 'true' : 'false';
      spriteWrap.dataset.facing = physics.facing === -1 ? 'right' : 'left';

      // Precision champagne pinpoint hotspot on desktop fine pointers
      const showDot = showCar && !isTouchMode;
      dot.style.opacity = showDot ? '1' : '0';
      dot.style.transform = `translate3d(${target.dotX.toFixed(2)}px, ${target.dotY.toFixed(2)}px, 0) translate(-50%, -50%) scale(${pressed ? 0.7 : interactiveHover ? 1.45 : 1})`;
    };

    const tick = (now: number) => {
      const dtScale = Math.min(2.5, Math.max(0.25, (now - lastTimestamp) / 16.667));
      lastTimestamp = now;

      const next = stepCursorPhysics(physics, {
        targetX: target.x,
        targetY: target.y,
        dtScale,
        smoothing: isTouchMode ? 0.3 : 0.24,
        reducedMotion: prefersReducedMotion,
      });

      physics.x = next.x;
      physics.y = next.y;
      physics.vx = next.vx;
      physics.vy = next.vy;
      physics.facing = next.facing;
      physics.tiltDeg = next.tiltDeg;

      applyVisuals();

      const distSq =
        (target.x - physics.x) ** 2 + (target.y - physics.y) ** 2;
      if (visible && (distSq > 0.12 || Math.abs(physics.tiltDeg) > 0.12)) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };

    const ensureAnimating = () => {
      if (rafId === null) {
        lastTimestamp = performance.now();
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const scheduleTouchAutoHide = () => {
      if (touchHideTimer !== null) {
        window.clearTimeout(touchHideTimer);
      }
      touchHideTimer = window.setTimeout(() => {
        visible = false;
        pressed = false;
        applyVisuals();
      }, TOUCH_IDLE_HIDE_MS);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const isTouch = event.pointerType === 'touch';
      isTouchMode = isTouch;

      const { interactive, yieldNative } = inspectElementTree(event.target);
      interactiveHover = interactive;
      yieldedToNative = !isTouch && yieldNative;

      if (isTouch) {
        const pos = computeTouchOffsetPosition(
          event.clientX,
          event.clientY,
          window.innerWidth,
          window.innerHeight,
        );
        if (!visible) {
          physics.x = pos.x;
          physics.y = pos.y;
        }
        target.x = pos.x;
        target.y = pos.y;
        target.dotX = event.clientX;
        target.dotY = event.clientY;
        visible = true;
        scheduleTouchAutoHide();
      } else {
        // Offset car slightly down-right from exact pointer tip so tip stays crisp & unobstructed
        const carTargetX = event.clientX + 20;
        const carTargetY = event.clientY + 14;
        if (!visible) {
          physics.x = carTargetX;
          physics.y = carTargetY;
        }
        target.x = carTargetX;
        target.y = carTargetY;
        target.dotX = event.clientX;
        target.dotY = event.clientY;
        visible = true;
      }

      syncBodyCursorClass();
      applyVisuals();
      ensureAnimating();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const isTouch = event.pointerType === 'touch';
      isTouchMode = isTouch;
      pressed = true;

      const { interactive, yieldNative } = inspectElementTree(event.target);
      interactiveHover = interactive;
      yieldedToNative = !isTouch && yieldNative;

      if (isTouch) {
        const pos = computeTouchOffsetPosition(
          event.clientX,
          event.clientY,
          window.innerWidth,
          window.innerHeight,
        );
        const jumpDist = Math.hypot(pos.x - physics.x, pos.y - physics.y);
        if (!visible || jumpDist > 160) {
          physics.x = pos.x - 14;
          physics.y = pos.y + 12;
        }
        target.x = pos.x;
        target.y = pos.y;
        target.dotX = event.clientX;
        target.dotY = event.clientY;
        visible = true;
        scheduleTouchAutoHide();
      } else {
        target.x = event.clientX + 20;
        target.y = event.clientY + 14;
        target.dotX = event.clientX;
        target.dotY = event.clientY;
        visible = true;
      }

      if (!yieldedToNative) {
        emitRipple(event.clientX, event.clientY);
      }

      syncBodyCursorClass();
      applyVisuals();
      ensureAnimating();
    };

    const handlePointerUp = (event: PointerEvent) => {
      pressed = false;
      if (event.pointerType === 'touch') {
        scheduleTouchAutoHide();
      }
      applyVisuals();
    };

    const handleTouchStart = (event: TouchEvent) => {
      const first = event.touches[0];
      if (!first) return;
      isTouchMode = true;
      pressed = true;
      yieldedToNative = false;
      const pos = computeTouchOffsetPosition(
        first.clientX,
        first.clientY,
        window.innerWidth,
        window.innerHeight,
      );
      const jumpDist = Math.hypot(pos.x - physics.x, pos.y - physics.y);
      if (!visible || jumpDist > 160) {
        physics.x = pos.x - 14;
        physics.y = pos.y + 12;
      }
      target.x = pos.x;
      target.y = pos.y;
      visible = true;
      emitRipple(first.clientX, first.clientY);
      scheduleTouchAutoHide();
      applyVisuals();
      ensureAnimating();
    };

    const handleTouchMove = (event: TouchEvent) => {
      const first = event.touches[0];
      if (!first) return;
      isTouchMode = true;
      yieldedToNative = false;
      const pos = computeTouchOffsetPosition(
        first.clientX,
        first.clientY,
        window.innerWidth,
        window.innerHeight,
      );
      target.x = pos.x;
      target.y = pos.y;
      visible = true;
      scheduleTouchAutoHide();
      ensureAnimating();
    };

    const handleTouchEnd = () => {
      pressed = false;
      scheduleTouchAutoHide();
      applyVisuals();
    };

    const handlePointerLeaveWindow = () => {
      if (!isTouchMode) {
        visible = false;
        pressed = false;
        syncBodyCursorClass();
        applyVisuals();
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeaveWindow);
    window.addEventListener('blur', handlePointerLeaveWindow);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (touchHideTimer !== null) window.clearTimeout(touchHideTimer);
      for (const timerId of rippleTimers) {
        window.clearTimeout(timerId);
      }
      rippleTimers.clear();
      document.body.classList.remove('porsche-cursor-active');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mouseleave', handlePointerLeaveWindow);
      window.removeEventListener('blur', handlePointerLeaveWindow);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none"
    >
      {/* Champagne-gold click & tap pulse rings */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="porsche-cursor-ripple fixed rounded-full border border-[#F5D66B]/85"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
          }}
        />
      ))}

      {/* Pinpoint champagne hotspot for pixel-exact desktop clicking */}
      <div
        ref={dotRef}
        data-testid="porsche-cursor-dot"
        className="fixed top-0 left-0 h-2 w-2 rounded-full bg-[#FFE27A] opacity-0 shadow-[0_0_10px_rgba(255,214,68,0.95),0_0_2px_rgba(0,0,0,0.95)] ring-1 ring-[#060607]/80 transition-opacity duration-200 will-change-transform"
      />

      {/* Dynamic Steering Yellow Porsche Cayman Cursor */}
      <div
        ref={carLayerRef}
        data-testid="porsche-cursor"
        className="fixed top-0 left-0 opacity-0 transition-opacity duration-200 will-change-transform"
      >
        <div
          ref={spriteWrapperRef}
          data-testid="porsche-cursor-sprite"
          className="porsche-cursor-sprite relative transition-transform duration-150 ease-out will-change-transform"
        >
          {/* Subtle warm road-glow beneath tires */}
          <span
            className="pointer-events-none absolute inset-x-1 -bottom-0.5 h-2.5 rounded-full blur-[5px] opacity-65"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255, 208, 40, 0.55) 0%, rgba(230, 198, 146, 0.14) 58%, transparent 100%)',
            }}
          />
          {!spriteFailed && (
            <img
              src={CURSOR_SPRITE_SRC}
              alt=""
              width={64}
              height={33}
              decoding="async"
              draggable={false}
              onError={() => setSpriteFailed(true)}
              className="relative block w-[58px] sm:w-[64px] h-auto drop-shadow-[0_6px_12px_rgba(0,0,0,0.82)]"
              style={{ imageRendering: 'auto' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
