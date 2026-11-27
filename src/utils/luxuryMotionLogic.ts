export interface Point2D {
  x: number;
  y: number;
}

export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SpecularPosition {
  xPct: number;
  yPct: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeMagneticOffset(
  clientX: number,
  clientY: number,
  rect: RectLike,
  maxOffsetPx = 5.5,
  disabled = false,
): Point2D {
  if (disabled || rect.width <= 0 || rect.height <= 0) {
    return { x: 0, y: 0 };
  }

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const normalizedX = clamp((clientX - centerX) / (rect.width / 2), -1, 1);
  const normalizedY = clamp((clientY - centerY) / (rect.height / 2), -1, 1);

  return {
    x: Number((normalizedX * maxOffsetPx).toFixed(2)),
    y: Number((normalizedY * maxOffsetPx).toFixed(2)),
  };
}

export function computeCardParallaxOffset(
  elementCenterY: number,
  viewportHeight: number,
  maxShiftPx = 16,
  disabled = false,
): number {
  if (disabled || viewportHeight <= 0) {
    return 0;
  }

  const viewportCenter = viewportHeight / 2;
  const normalizedProgress = clamp(
    (elementCenterY - viewportCenter) / (viewportHeight * 0.75),
    -1,
    1,
  );

  return Number((normalizedProgress * maxShiftPx).toFixed(2));
}

export function computeSpecularCoordinates(
  clientX: number,
  clientY: number,
  rect: RectLike,
): SpecularPosition {
  if (rect.width <= 0 || rect.height <= 0) {
    return { xPct: 50, yPct: 50 };
  }

  const xPct = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
  const yPct = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);

  return {
    xPct: Number(xPct.toFixed(1)),
    yPct: Number(yPct.toFixed(1)),
  };
}

export function shouldSkipIntroCurtain(
  prefersReducedMotion: boolean,
  searchQuery = '',
): boolean {
  if (prefersReducedMotion) return true;
  if (!searchQuery) return false;
  const params = new URLSearchParams(searchQuery);
  return params.get('autostart') === '1';
}

export function buildWhatsAppConciergeUrl(
  phoneDigits: string,
  message: string,
): string {
  const sanitized = phoneDigits.replace(/[^\d]/g, '');
  return `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
}

export function buildGoogleMapsDirectionsUrl(addressQuery: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    addressQuery,
  )}`;
}
