export type CursorFacing = 1 | -1; // 1 = facing left (native sprite), -1 = flipped facing right

export interface CursorPhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: CursorFacing;
  tiltDeg: number;
}

export interface CursorPhysicsStepOptions {
  targetX: number;
  targetY: number;
  dtScale?: number;
  smoothing?: number;
  reducedMotion?: boolean;
}

const FACING_HYSTERESIS_PX = 1.6;
const MAX_TILT_DEG = 11;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Advances cursor position, velocity, facing direction (with hysteresis to avoid jitter),
 * and subtle dynamic chassis tilt. Pure function for deterministic testing.
 */
export function stepCursorPhysics(
  prev: CursorPhysicsState,
  options: CursorPhysicsStepOptions,
): CursorPhysicsState {
  const {
    targetX,
    targetY,
    dtScale = 1,
    smoothing = 0.24,
    reducedMotion = false,
  } = options;

  if (reducedMotion) {
    const dx = targetX - prev.x;
    const facing: CursorFacing =
      dx > FACING_HYSTERESIS_PX
        ? -1
        : dx < -FACING_HYSTERESIS_PX
          ? 1
          : prev.facing;
    return {
      x: targetX,
      y: targetY,
      vx: 0,
      vy: 0,
      facing,
      tiltDeg: 0,
    };
  }

  const alpha = clamp(1 - Math.pow(1 - smoothing, clamp(dtScale, 0.2, 3)), 0.05, 0.85);
  const nextX = prev.x + (targetX - prev.x) * alpha;
  const nextY = prev.y + (targetY - prev.y) * alpha;
  const vx = nextX - prev.x;
  const vy = nextY - prev.y;

  let facing: CursorFacing = prev.facing;
  if (vx > FACING_HYSTERESIS_PX) {
    facing = -1;
  } else if (vx < -FACING_HYSTERESIS_PX) {
    facing = 1;
  }

  // Slight nose-lift / pitch based on horizontal & vertical travel, respecting sprite flip
  const rawTilt = (vy * 0.45 + vx * 0.22) * (facing === -1 ? 1 : -1);
  const tiltDeg = clamp(rawTilt, -MAX_TILT_DEG, MAX_TILT_DEG);

  return {
    x: nextX,
    y: nextY,
    vx,
    vy,
    facing,
    tiltDeg,
  };
}

/**
 * Offsets touch coordinates slightly above the fingertip so the car remains visible
 * on phones and tablets while staying safely inside the viewport.
 */
export function computeTouchOffsetPosition(
  clientX: number,
  clientY: number,
  viewportWidth: number,
  viewportHeight: number,
  verticalOffsetPx = 38,
): { x: number; y: number } {
  const marginX = 28;
  const marginY = 24;
  return {
    x: clamp(clientX, marginX, Math.max(marginX, viewportWidth - marginX)),
    y: clamp(
      clientY - verticalOffsetPx,
      marginY,
      Math.max(marginY, viewportHeight - marginY),
    ),
  };
}

const INTERACTIVE_TAGS = new Set(['A', 'BUTTON', 'LABEL', 'SUMMARY']);
const NATIVE_CURSOR_TAGS = new Set(['IFRAME', 'TEXTAREA', 'SELECT']);
const TEXT_INPUT_TYPES = new Set([
  'text',
  'email',
  'tel',
  'search',
  'url',
  'password',
  'number',
  'date',
]);

export function isInteractiveElementDescriptor(descriptor: {
  tagName: string;
  role?: string | null;
  type?: string | null;
}): boolean {
  const tag = descriptor.tagName.toUpperCase();
  if (INTERACTIVE_TAGS.has(tag)) return true;
  if (tag === 'INPUT') {
    const inputType = (descriptor.type ?? '').toLowerCase();
    return inputType === 'range' || inputType === 'checkbox' || inputType === 'radio' || inputType === 'submit' || inputType === 'button';
  }
  const role = (descriptor.role ?? '').toLowerCase();
  return role === 'button' || role === 'tab' || role === 'link' || role === 'application' || role === 'slider';
}

export function shouldYieldToNativeCursor(descriptor: {
  tagName: string;
  type?: string | null;
}): boolean {
  const tag = descriptor.tagName.toUpperCase();
  if (NATIVE_CURSOR_TAGS.has(tag)) return true;
  if (tag === 'INPUT') {
    const inputType = (descriptor.type ?? 'text').toLowerCase();
    return TEXT_INPUT_TYPES.has(inputType);
  }
  return false;
}
