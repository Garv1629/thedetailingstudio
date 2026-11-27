export interface ContainDrawRect {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

export interface VideoSequenceSegment {
  basePath: string;
  frameCount: number;
  extension?: string;
}

export interface BoundaryCrossfade {
  fromIndex: number;
  toIndex: number;
  alpha: number;
}

/**
 * Computes normalized [0, 1] scroll progress for a pinned/sticky scroll sequence.
 * Progress is 0 while the sequence top is at or below the top of the viewport,
 * advances linearly across (rectHeight - viewportHeight), and clamps to 1 once
 * the sequence bottom reaches the bottom of the viewport.
 */
export function computeSectionScrollProgress(
  rectTop: number,
  rectHeight: number,
  viewportHeight: number,
): number {
  const safeViewport = Math.max(1, viewportHeight);
  const scrollableDistance = rectHeight - safeViewport;

  if (scrollableDistance <= 0) {
    return rectTop <= 0 ? 1 : 0;
  }

  const rawProgress = -rectTop / scrollableDistance;
  if (rawProgress <= 0) return 0;
  if (rawProgress >= 1) return 1;
  return rawProgress;
}

/**
 * Maps a normalized [0, 1] scroll progress value to a 0-based frame index
 * in [0, totalFrames - 1].
 */
export function progressToFrameIndex(
  progress: number,
  totalFrames: number,
): number {
  if (totalFrames <= 1) return 0;
  const clamped = Math.min(1, Math.max(0, progress));
  return Math.round(clamped * (totalFrames - 1));
}

/**
 * Formats a 0-based frame index into the sequential 1-based FFmpeg output URL
 * (e.g., index 0 -> `${basePath}/frame_00001.webp`).
 */
export function formatFrameUrl(
  basePath: string,
  frameIndex: number,
  extension = 'webp',
): string {
  const cleanBase = basePath.replace(/\/+$/, '');
  const safeIndex = Math.max(0, Math.floor(frameIndex));
  const paddedNumber = String(safeIndex + 1).padStart(5, '0');
  return `${cleanBase}/frame_${paddedNumber}.${extension}`;
}

/**
 * Sums total frame counts across one or more continuous video segments.
 */
export function getTotalSegmentFrames(segments: VideoSequenceSegment[]): number {
  return segments.reduce(
    (sum, segment) => sum + Math.max(0, Math.floor(segment.frameCount)),
    0,
  );
}

/**
 * Resolves a global 0-based frame index across multiple continuous video segments
 * into the exact sequential frame URL without merging files on disk.
 */
export function resolveSegmentFrameUrl(
  segments: VideoSequenceSegment[],
  globalFrameIndex: number,
): string {
  if (segments.length === 0) return '';

  const totalFrames = getTotalSegmentFrames(segments);
  const clampedGlobal = Math.min(
    Math.max(0, totalFrames - 1),
    Math.max(0, Math.floor(globalFrameIndex)),
  );

  let offset = 0;
  for (const segment of segments) {
    const count = Math.max(0, Math.floor(segment.frameCount));
    if (clampedGlobal < offset + count) {
      return formatFrameUrl(
        segment.basePath,
        clampedGlobal - offset,
        segment.extension ?? 'webp',
      );
    }
    offset += count;
  }

  const lastSegment = segments[segments.length - 1];
  return formatFrameUrl(
    lastSegment.basePath,
    Math.max(0, lastSegment.frameCount - 1),
    lastSegment.extension ?? 'webp',
  );
}

/**
 * Returns global boundary frame indices (last frame of segment N and first frame
 * of segment N+1) so segment junctions can be pinned in cache and smoothly blended.
 */
export function getSegmentBoundaryPairs(
  segments: VideoSequenceSegment[],
): Array<{ fromIndex: number; toIndex: number }> {
  const pairs: Array<{ fromIndex: number; toIndex: number }> = [];
  let offset = 0;

  for (let i = 0; i < segments.length - 1; i += 1) {
    const count = Math.max(0, Math.floor(segments[i].frameCount));
    const nextCount = Math.max(0, Math.floor(segments[i + 1].frameCount));
    if (count > 0 && nextCount > 0) {
      pairs.push({
        fromIndex: offset + count - 1,
        toIndex: offset + count,
      });
    }
    offset += count;
  }

  return pairs;
}

/**
 * Computes a gentle crossfade dissolve solely across the exact junction between
 * consecutive video segments so scrolling from Video 1 into Video 2 has no hard cut.
 */
export function computeBoundaryCrossfade(
  exactFrame: number,
  segments: VideoSequenceSegment[],
  halfSpan = 1.5,
): BoundaryCrossfade | null {
  const pairs = getSegmentBoundaryPairs(segments);
  for (const pair of pairs) {
    const midpoint = pair.fromIndex + 0.5;
    const start = midpoint - halfSpan;
    const end = midpoint + halfSpan;
    if (exactFrame > start && exactFrame < end) {
      const t = (exactFrame - start) / (end - start);
      const smoothAlpha = t * t * (3 - 2 * t);
      return {
        fromIndex: pair.fromIndex,
        toIndex: pair.toIndex,
        alpha: Math.min(1, Math.max(0, smoothAlpha)),
      };
    }
  }
  return null;
}

/**
 * Computes centered contain-mode destination coordinates so the full video frame
 * is always visible with its exact native aspect ratio (zero cropping, zero stretching).
 */
export function computeContainDrawRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): ContainDrawRect {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    targetWidth <= 0 ||
    targetHeight <= 0
  ) {
    return { dx: 0, dy: 0, dw: 0, dh: 0 };
  }

  const scale = Math.min(
    targetWidth / sourceWidth,
    targetHeight / sourceHeight,
  );
  const dw = sourceWidth * scale;
  const dh = sourceHeight * scale;
  const dx = (targetWidth - dw) / 2;
  const dy = (targetHeight - dh) / 2;

  return { dx, dy, dw, dh };
}

/**
 * Returns the initial set of frame indices to preload eagerly (first N frames,
 * final boundary frame, and any segment junction frames).
 */
export function getInitialPreloadIndices(
  totalFrames: number,
  initialCount = 10,
  extraPinned: number[] = [],
): number[] {
  if (totalFrames <= 0) return [];
  const seen = new Set<number>();
  const indices: number[] = [];

  const pushUnique = (idx: number) => {
    if (idx >= 0 && idx < totalFrames && !seen.has(idx)) {
      seen.add(idx);
      indices.push(idx);
    }
  };

  const limit = Math.min(totalFrames, Math.max(1, initialCount));
  for (let i = 0; i < limit; i += 1) {
    pushUnique(i);
  }
  pushUnique(totalFrames - 1);
  for (const idx of extraPinned) {
    pushUnique(idx);
  }

  return indices;
}

/**
 * Returns prioritized frame indices around `currentIndex` to prefetch smoothly
 * in both scroll directions without over-fetching the entire sequence at once.
 */
export function getPrefetchFrameIndices(
  currentIndex: number,
  totalFrames: number,
  aheadCount = 12,
  behindCount = 4,
): number[] {
  if (totalFrames <= 0) return [];
  const clampedCurrent = Math.min(
    totalFrames - 1,
    Math.max(0, Math.floor(currentIndex)),
  );
  const result: number[] = [clampedCurrent];
  const maxStep = Math.max(aheadCount, behindCount);

  for (let step = 1; step <= maxStep; step += 1) {
    if (step <= aheadCount) {
      const ahead = clampedCurrent + step;
      if (ahead < totalFrames) {
        result.push(ahead);
      }
    }
    if (step <= behindCount) {
      const behind = clampedCurrent - step;
      if (behind >= 0) {
        result.push(behind);
      }
    }
  }

  return result;
}

/**
 * Finds the closest already-decoded frame index to `targetIndex` so rapid
 * scrubbing always paints a crisp image instead of flashing blank.
 */
export function findNearestLoadedFrame(
  targetIndex: number,
  isLoaded: (index: number) => boolean,
  totalFrames: number,
): number | null {
  if (totalFrames <= 0) return null;
  const clampedTarget = Math.min(
    totalFrames - 1,
    Math.max(0, Math.floor(targetIndex)),
  );

  if (isLoaded(clampedTarget)) return clampedTarget;

  const maxDelta = Math.max(clampedTarget, totalFrames - 1 - clampedTarget);
  for (let delta = 1; delta <= maxDelta; delta += 1) {
    const prev = clampedTarget - delta;
    if (prev >= 0 && isLoaded(prev)) return prev;

    const next = clampedTarget + delta;
    if (next < totalFrames && isLoaded(next)) return next;
  }

  return null;
}

/**
 * Selects cached frame indices farthest from `currentIndex` to evict once the
 * in-memory frame cache exceeds `maxCacheSize`, keeping boundary and pinned frames.
 */
export function selectFramesToEvict(
  cachedIndices: number[],
  currentIndex: number,
  totalFrames: number,
  maxCacheSize = 56,
  extraPinned: number[] = [],
): number[] {
  if (cachedIndices.length <= maxCacheSize) return [];

  const lastIndex = Math.max(0, totalFrames - 1);
  const pinned = new Set<number>([0, lastIndex, currentIndex, ...extraPinned]);
  const evictCount = cachedIndices.length - maxCacheSize;

  const evictable = cachedIndices
    .filter((idx) => !pinned.has(idx))
    .sort(
      (a, b) =>
        Math.abs(b - currentIndex) - Math.abs(a - currentIndex) || b - a,
    );

  return evictable.slice(0, evictCount);
}

export interface VideoBufferDimensions {
  width: number;
  height: number;
}

/**
 * Computes a quantized backing-buffer size strictly matching the video's native
 * aspect ratio (e.g., 16:9), bounded to the source frame dimensions so we never
 * waste GPU fill-rate upscaling or reallocate on minor mobile URL-bar height shifts.
 */
export function computeOptimalVideoBufferSize(
  sourceWidth: number,
  sourceHeight: number,
  stageWidth: number,
  stageHeight: number,
  dpr = 1,
): VideoBufferDimensions {
  const safeSourceW = Math.max(16, Math.round(sourceWidth));
  const safeSourceH = Math.max(9, Math.round(sourceHeight));
  const aspect = safeSourceW / safeSourceH;

  const safeStageW = Math.max(1, stageWidth);
  const safeStageH = Math.max(1, stageHeight);
  const safeDpr = Math.min(2, Math.max(1, dpr));

  const contained = computeContainDrawRect(
    safeSourceW,
    safeSourceH,
    safeStageW,
    safeStageH,
  );
  const idealWidth = Math.min(safeSourceW, Math.ceil(contained.dw * safeDpr));

  // Quantize to stable 160px tiers so minor viewport/address-bar changes do not
  // recreate the canvas buffer or trigger black flashes.
  const TIER_STEP = 160;
  const minWidth = Math.min(safeSourceW, 480);
  const quantizedWidth = Math.min(
    safeSourceW,
    Math.max(minWidth, Math.ceil(idealWidth / TIER_STEP) * TIER_STEP),
  );
  const quantizedHeight = Math.max(
    9,
    Math.round(quantizedWidth / aspect),
  );

  return {
    width: quantizedWidth,
    height: quantizedHeight,
  };
}

/**
 * Builds a direction-aware, priority-ordered frame prefetch list around `currentIndex`.
 * Order:
 *  1) Exact current frame
 *  2) Immediate neighbors (+dir, -dir)
 *  3) Forward lookahead in active scroll direction, interleaved with trailing frames
 *  4) Optional pinned junction/boundary frames
 */
export function buildPrioritizedPrefetchQueue(
  currentIndex: number,
  totalFrames: number,
  direction: 1 | -1 = 1,
  aheadCount = 12,
  behindCount = 4,
  pinnedIndices: number[] = [],
): number[] {
  if (totalFrames <= 0) return [];
  const clamped = Math.min(
    totalFrames - 1,
    Math.max(0, Math.floor(currentIndex)),
  );
  const seen = new Set<number>();
  const queue: number[] = [];

  const add = (idx: number) => {
    if (idx >= 0 && idx < totalFrames && !seen.has(idx)) {
      seen.add(idx);
      queue.push(idx);
    }
  };

  add(clamped);

  const maxStep = Math.max(aheadCount, behindCount);
  for (let step = 1; step <= maxStep; step += 1) {
    if (step <= aheadCount) {
      add(clamped + direction * step);
    }
    if (step <= behindCount) {
      add(clamped - direction * step);
    }
  }

  for (const pinned of pinnedIndices) {
    add(pinned);
  }

  return queue;
}

/**
 * Determines whether an in-flight frame fetch has become stale because the user
 * scrubbed far away, so it can be cleanly aborted to avoid saturating bandwidth.
 */
export function shouldAbortPendingFrame(
  pendingIndex: number,
  currentIndex: number,
  maxDistance = 24,
  pinnedIndices: number[] = [],
): boolean {
  if (pendingIndex === 0) return false;
  if (pinnedIndices.includes(pendingIndex)) return false;
  return Math.abs(pendingIndex - currentIndex) > maxDistance;
}

/**
 * Maps continuous scroll progress [0, 1] to calm discrete chapter keyframes
 * when `prefers-reduced-motion: reduce` is active, preventing rapid frame scrubbing
 * while preserving key visual landmarks (including the wrap colour showcase).
 */
export function resolveReducedMotionFrame(
  progress: number,
  totalFrames: number,
): number {
  if (totalFrames <= 1) return 0;
  const clamped = Math.min(1, Math.max(0, progress));
  const last = totalFrames - 1;

  if (clamped < 0.18) return 0;
  if (clamped < 0.5) return Math.round(last * 0.22);
  if (clamped < 0.8) return Math.round(last * 0.56);
  return Math.round(last * 0.9);
}

