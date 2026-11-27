import { useCallback, useRef, type ButtonHTMLAttributes, type PointerEvent } from 'react';
import { computeMagneticOffset } from '../utils/luxuryMotionLogic';

interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  maxOffsetPx?: number;
}

export function MagneticButton({
  maxOffsetPx = 5.5,
  className = '',
  onPointerMove,
  onPointerLeave,
  onBlur,
  children,
  ...rest
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const resetOffset = useCallback(() => {
    const node = buttonRef.current;
    if (!node) return;
    node.style.setProperty('--mag-x', '0px');
    node.style.setProperty('--mag-y', '0px');
  }, []);

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerMove?.(event);
    if (event.pointerType !== 'mouse') return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const node = buttonRef.current;
    if (!node) return;

    const { x, y } = computeMagneticOffset(
      event.clientX,
      event.clientY,
      node.getBoundingClientRect(),
      maxOffsetPx,
      prefersReduced,
    );
    node.style.setProperty('--mag-x', `${x}px`);
    node.style.setProperty('--mag-y', `${y}px`);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLButtonElement>) => {
    resetOffset();
    onPointerLeave?.(event);
  };

  return (
    <button
      ref={buttonRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onBlur={(event) => {
        resetOffset();
        onBlur?.(event);
      }}
      className={`magnetic-cta ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
