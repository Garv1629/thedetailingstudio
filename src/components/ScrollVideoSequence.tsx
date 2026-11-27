import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { WrapColourId } from '../data/atelierData';
import {
  PORSCHE_WRAP_MASK_GEOMETRY,
  WRAP_SHOT_START_FRAME,
  recolorCarBodyPixel,
  resolveActiveWrapPaint,
  type CarWrapPaintPreset,
} from '../utils/carWrapColorLogic';
import {
  buildPrioritizedPrefetchQueue,
  computeBoundaryCrossfade,
  computeContainDrawRect,
  computeOptimalVideoBufferSize,
  computeSectionScrollProgress,
  findNearestLoadedFrame,
  getInitialPreloadIndices,
  getSegmentBoundaryPairs,
  getTotalSegmentFrames,
  progressToFrameIndex,
  resolveReducedMotionFrame,
  resolveSegmentFrameUrl,
  selectFramesToEvict,
  shouldAbortPendingFrame,
  type VideoSequenceSegment,
} from '../utils/scrollVideoLogic';

interface ScrollVideoSequenceProps {
  sequenceId: string;
  segments: VideoSequenceSegment[];
  ariaLabel: string;
  eagerPreload?: boolean;
  activeWrapColourId?: WrapColourId | null;
  activeCustomWrapHex?: string | null;
  children: ReactNode;
}

type DecodedFrame = ImageBitmap | HTMLImageElement;

const STAGE_BG_COLOR = '#060607';
const DEFAULT_NATIVE_WIDTH = 1440;
const DEFAULT_NATIVE_HEIGHT = 810;
const MAX_TINTED_CACHE = 20;
const MASK_BUFFER_WIDTH = 720;
const MASK_BUFFER_HEIGHT = 405;
const FRAME_CACHE_NAME = 'tds-detailing-frames-v1';

let frameCachePromise: Promise<Cache | null> | null = null;

function getFrameCache(): Promise<Cache | null> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return Promise.resolve(null);
  }
  if (!frameCachePromise) {
    frameCachePromise = window.caches
      .open(FRAME_CACHE_NAME)
      .catch(() => null);
  }
  return frameCachePromise;
}

function getDecodedFrameSize(frame: DecodedFrame): {
  width: number;
  height: number;
} {
  if ('naturalWidth' in frame) {
    return {
      width: frame.naturalWidth,
      height: frame.naturalHeight,
    };
  }
  return {
    width: frame.width,
    height: frame.height,
  };
}

function isDecodedFrameReady(frame: DecodedFrame | undefined): frame is DecodedFrame {
  if (!frame) return false;
  if ('naturalWidth' in frame) {
    return frame.complete && frame.naturalWidth > 0 && frame.naturalHeight > 0;
  }
  return frame.width > 0 && frame.height > 0;
}

function releaseDecodedFrame(frame: DecodedFrame) {
  if ('close' in frame && typeof frame.close === 'function') {
    try {
      frame.close();
    } catch {
      // Ignore already-closed ImageBitmap instances
    }
  }
}

function traceNormalizedPolygon(
  ctx: CanvasRenderingContext2D,
  points: ReadonlyArray<readonly [number, number]>,
  width: number,
  height: number,
) {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0] * width, points[0][1] * height);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i][0] * width, points[i][1] * height);
  }
  ctx.closePath();
}

/**
 * Generates a softly feathered alpha mask (0..255 per pixel) isolating ONLY
 * the Porsche's painted/wrapped rear quarter panel & bumper in Video 2's
 * locked-camera wrap sequence, excluding studio walls, glass, wheel, and lights.
 */
function buildPorscheCarBodyAlphaMask(
  width: number,
  height: number,
): Uint8ClampedArray {
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const mctx = maskCanvas.getContext('2d');
  if (!mctx) return new Uint8ClampedArray(width * height);

  mctx.clearRect(0, 0, width, height);
  mctx.fillStyle = '#ffffff';
  mctx.filter = 'blur(4px)';
  traceNormalizedPolygon(
    mctx,
    PORSCHE_WRAP_MASK_GEOMETRY.bodyPolygon,
    width,
    height,
  );
  mctx.fill();

  // Subtract non-paint regions cleanly
  mctx.globalCompositeOperation = 'destination-out';
  mctx.filter = 'blur(2.5px)';

  // 1. Rear side window glass
  traceNormalizedPolygon(
    mctx,
    PORSCHE_WRAP_MASK_GEOMETRY.windowCutout,
    width,
    height,
  );
  mctx.fill();

  // 2. Rear tire, alloy wheel, brake rotor & Porsche crest
  const wheel = PORSCHE_WRAP_MASK_GEOMETRY.wheelArchCutout;
  mctx.beginPath();
  mctx.ellipse(
    wheel.cx * width,
    wheel.cy * height,
    wheel.rx * width,
    wheel.ry * height,
    0,
    0,
    Math.PI * 2,
  );
  mctx.fill();

  // 3. Smoked ruby rear taillight bar
  traceNormalizedPolygon(
    mctx,
    PORSCHE_WRAP_MASK_GEOMETRY.taillightCutout,
    width,
    height,
  );
  mctx.fill();

  // 4. Lower matte diffuser & red reflector
  traceNormalizedPolygon(
    mctx,
    PORSCHE_WRAP_MASK_GEOMETRY.lowerDiffuserCutout,
    width,
    height,
  );
  mctx.fill();

  const data = mctx.getImageData(0, 0, width, height).data;
  const alphas = new Uint8ClampedArray(width * height);
  for (let i = 0; i < alphas.length; i += 1) {
    alphas[i] = data[i * 4 + 3];
  }
  return alphas;
}

export function ScrollVideoSequence({
  sequenceId,
  segments,
  ariaLabel,
  eagerPreload = false,
  activeWrapColourId = null,
  activeCustomWrapHex = null,
  children,
}: ScrollVideoSequenceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const segmentsRef = useRef<VideoSequenceSegment[]>(segments);
  const activeWrapColourRef = useRef<WrapColourId | null>(activeWrapColourId);
  const activeCustomWrapHexRef = useRef<string | null>(activeCustomWrapHex);
  const forceRedrawRef = useRef<(() => void) | null>(null);

  segmentsRef.current = segments;

  const totalFrames = useMemo(
    () => getTotalSegmentFrames(segments),
    [segments],
  );
  const segmentsKey = useMemo(
    () =>
      segments
        .map((s) => `${s.basePath}:${s.frameCount}:${s.extension ?? 'webp'}`)
        .join('|'),
    [segments],
  );
  const firstFrameUrl = useMemo(
    () => (totalFrames > 0 ? resolveSegmentFrameUrl(segments, 0) : ''),
    [segments, totalFrames],
  );

  // Single state transition on initial first-frame paint (zero scroll re-renders)
  const [firstFrameReady, setFirstFrameReady] = useState(false);

  // Update active car wrap colour refs & trigger instant single-frame repaint without tearing down video state
  useEffect(() => {
    activeWrapColourRef.current = activeWrapColourId;
    activeCustomWrapHexRef.current = activeCustomWrapHex;
    forceRedrawRef.current?.();
  }, [activeWrapColourId, activeCustomWrapHex]);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const activeSegments = segmentsRef.current;
    if (!container || !stage || !canvas || totalFrames <= 0) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const reducedMotionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let prefersReducedMotion = Boolean(reducedMotionQuery?.matches);

    const boundaryPairs = getSegmentBoundaryPairs(activeSegments);
    const pinnedJunctionFrames = boundaryPairs.flatMap((pair) => [
      pair.fromIndex,
      pair.toIndex,
    ]);
    const reducedMotionKeyframes = Array.from(
      new Set([
        resolveReducedMotionFrame(0, totalFrames),
        resolveReducedMotionFrame(0.35, totalFrames),
        resolveReducedMotionFrame(0.65, totalFrames),
        resolveReducedMotionFrame(0.95, totalFrames),
      ]),
    );

    const loadedFrames = new Map<number, DecodedFrame>();
    const inFlightControllers = new Map<number, AbortController>();
    let pendingQueue: number[] = [];

    const tintedFrameCache = new Map<string, HTMLCanvasElement>();
    const rawSourcePixelCache = new Map<number, Uint8ClampedArray>();
    let compactMask: {
      indices: Uint32Array;
      alphas: Float32Array;
    } | null = null;
    let scratchSourceCanvas: HTMLCanvasElement | null = null;
    let liveCustomCanvas: HTMLCanvasElement | null = null;
    let liveCustomImageData: ImageData | null = null;

    let disposed = false;
    let rafId: number | null = null;
    let nativeWidth = DEFAULT_NATIVE_WIDTH;
    let nativeHeight = DEFAULT_NATIVE_HEIGHT;
    let currentFrameIndex = 0;
    let currentExactFrame = 0;
    let scrollDirection: 1 | -1 = 1;
    let lastDrawSignature = '';
    let lastDrawnFrameIndex = -1;
    let hasNotifiedFirstReady = false;
    let isNearViewport = eagerPreload;

    const getDeviceBudgets = () => {
      const stageW = Math.max(1, stage.clientWidth || window.innerWidth || 1440);
      const isCompact = stageW <= 768;
      return {
        maxConcurrent: isCompact ? 4 : 6,
        maxCachedFrames: isCompact ? 40 : 60,
        aheadCount: isCompact ? 10 : 14,
        behindCount: isCompact ? 4 : 6,
        abortDistance: isCompact ? 22 : 30,
      };
    };

    const getCompactCarBodyMask = () => {
      if (!compactMask) {
        const rawMask = buildPorscheCarBodyAlphaMask(
          MASK_BUFFER_WIDTH,
          MASK_BUFFER_HEIGHT,
        );
        let nonZeroCount = 0;
        for (let i = 0; i < rawMask.length; i += 1) {
          if (rawMask[i] > 0) nonZeroCount += 1;
        }
        const indices = new Uint32Array(nonZeroCount);
        const alphas = new Float32Array(nonZeroCount);
        let cursor = 0;
        for (let i = 0; i < rawMask.length; i += 1) {
          const val = rawMask[i];
          if (val > 0) {
            indices[cursor] = i * 4;
            alphas[cursor] = val / 255;
            cursor += 1;
          }
        }
        compactMask = { indices, alphas };
      }
      return compactMask;
    };

    const getRawFramePixels = (
      frameIndex: number,
      source: DecodedFrame,
    ): Uint8ClampedArray | null => {
      const cached = rawSourcePixelCache.get(frameIndex);
      if (cached) return cached;

      if (!scratchSourceCanvas) {
        scratchSourceCanvas = document.createElement('canvas');
        scratchSourceCanvas.width = MASK_BUFFER_WIDTH;
        scratchSourceCanvas.height = MASK_BUFFER_HEIGHT;
      }
      const sctx = scratchSourceCanvas.getContext('2d', {
        willReadFrequently: true,
      });
      if (!sctx) return null;

      sctx.drawImage(source, 0, 0, MASK_BUFFER_WIDTH, MASK_BUFFER_HEIGHT);
      const raw = sctx.getImageData(
        0,
        0,
        MASK_BUFFER_WIDTH,
        MASK_BUFFER_HEIGHT,
      ).data;
      const copy = new Uint8ClampedArray(raw);

      if (rawSourcePixelCache.size >= 10) {
        const oldestFrame = rawSourcePixelCache.keys().next().value;
        if (oldestFrame !== undefined) {
          rawSourcePixelCache.delete(oldestFrame);
        }
      }
      rawSourcePixelCache.set(frameIndex, copy);
      return copy;
    };

    const getCarBodyTintedFrame = (
      frameIndex: number,
      source: DecodedFrame,
      paintKey: string,
      preset: CarWrapPaintPreset,
    ): HTMLCanvasElement => {
      const isCustom = paintKey.startsWith('custom:');
      const cacheKey = `${frameIndex}:${paintKey}`;
      if (!isCustom) {
        const cached = tintedFrameCache.get(cacheKey);
        if (cached) return cached;
      }

      const sourcePixels = getRawFramePixels(frameIndex, source);
      const { indices, alphas } = getCompactCarBodyMask();

      let targetCanvas: HTMLCanvasElement;
      let targetCtx: CanvasRenderingContext2D | null;
      let imageData: ImageData;

      if (isCustom) {
        if (!liveCustomCanvas) {
          liveCustomCanvas = document.createElement('canvas');
          liveCustomCanvas.width = MASK_BUFFER_WIDTH;
          liveCustomCanvas.height = MASK_BUFFER_HEIGHT;
        }
        targetCanvas = liveCustomCanvas;
        targetCtx = targetCanvas.getContext('2d');
        if (!targetCtx || !sourcePixels) return targetCanvas;
        if (!liveCustomImageData) {
          liveCustomImageData = targetCtx.createImageData(
            MASK_BUFFER_WIDTH,
            MASK_BUFFER_HEIGHT,
          );
        }
        imageData = liveCustomImageData;
      } else {
        targetCanvas = document.createElement('canvas');
        targetCanvas.width = MASK_BUFFER_WIDTH;
        targetCanvas.height = MASK_BUFFER_HEIGHT;
        targetCtx = targetCanvas.getContext('2d');
        if (!targetCtx || !sourcePixels) return targetCanvas;
        imageData = targetCtx.createImageData(
          MASK_BUFFER_WIDTH,
          MASK_BUFFER_HEIGHT,
        );
      }

      const outPixels = imageData.data;
      outPixels.set(sourcePixels);

      for (let i = 0; i < indices.length; i += 1) {
        const p = indices[i];
        const [nr, ng, nb] = recolorCarBodyPixel(
          sourcePixels[p],
          sourcePixels[p + 1],
          sourcePixels[p + 2],
          alphas[i],
          preset,
        );
        outPixels[p] = nr;
        outPixels[p + 1] = ng;
        outPixels[p + 2] = nb;
      }

      targetCtx.putImageData(imageData, 0, 0);

      if (!isCustom) {
        if (tintedFrameCache.size >= MAX_TINTED_CACHE) {
          const oldestKey = tintedFrameCache.keys().next().value;
          if (oldestKey !== undefined) {
            tintedFrameCache.delete(oldestKey);
          }
        }
        tintedFrameCache.set(cacheKey, targetCanvas);
      }
      return targetCanvas;
    };

    const syncCanvasBuffer = () => {
      const stageW = Math.max(1, Math.round(stage.clientWidth));
      const stageH = Math.max(1, Math.round(stage.clientHeight));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const optimal = computeOptimalVideoBufferSize(
        nativeWidth,
        nativeHeight,
        stageW,
        stageH,
        dpr,
      );

      // Quantized 16:9 backing buffer avoids clearing the canvas on mobile URL-bar jitter
      if (canvas.width !== optimal.width || canvas.height !== optimal.height) {
        canvas.width = optimal.width;
        canvas.height = optimal.height;
        lastDrawSignature = '';
      }

      const containRect = computeContainDrawRect(
        nativeWidth,
        nativeHeight,
        stageW,
        stageH,
      );
      container.setAttribute(
        'data-draw-rect',
        `${Math.round(containRect.dx)},${Math.round(containRect.dy)},${Math.round(containRect.dw)},${Math.round(containRect.dh)}`,
      );
      return optimal;
    };

    const drawFullFrame = (
      source: DecodedFrame | HTMLCanvasElement,
      targetW: number,
      targetH: number,
      alpha = 1,
    ) => {
      ctx.globalAlpha = alpha;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source, 0, 0, targetW, targetH);
    };

    const drawFrameToCanvas = (
      frameIndex: number,
      exactFrame: number,
      forceRedraw = false,
    ) => {
      const { width: targetW, height: targetH } = syncCanvasBuffer();
      const activePaint = resolveActiveWrapPaint(
        activeWrapColourRef.current,
        activeCustomWrapHexRef.current,
      );

      // Smoothly dissolve right across the junction between Video 1 and Video 2
      if (!prefersReducedMotion) {
        const crossfade = computeBoundaryCrossfade(
          exactFrame,
          activeSegments,
          1.5,
        );
        if (crossfade) {
          const fromFrame = loadedFrames.get(crossfade.fromIndex);
          const toFrame = loadedFrames.get(crossfade.toIndex);
          if (isDecodedFrameReady(fromFrame) && isDecodedFrameReady(toFrame)) {
            const roundedAlpha = Math.round(crossfade.alpha * 100) / 100;
            const sig = `blend:${crossfade.fromIndex}->${crossfade.toIndex}:${roundedAlpha}:${targetW}x${targetH}`;
            if (!forceRedraw && sig === lastDrawSignature) return;

            ctx.globalAlpha = 1;
            drawFullFrame(fromFrame, targetW, targetH, 1);
            drawFullFrame(toFrame, targetW, targetH, roundedAlpha);
            ctx.globalAlpha = 1;

            lastDrawSignature = sig;
            lastDrawnFrameIndex = frameIndex;
            container.setAttribute('data-rendered-frame', String(frameIndex));
            return;
          }
        }
      }

      const drawableIndex = findNearestLoadedFrame(
        frameIndex,
        (idx) => loadedFrames.has(idx),
        totalFrames,
      );
      if (drawableIndex === null) return;

      const shouldRecolorCarBody =
        activePaint !== null && drawableIndex >= WRAP_SHOT_START_FRAME;
      const sig = `frame:${drawableIndex}:wrap:${shouldRecolorCarBody ? activePaint.key : 'none'}:${targetW}x${targetH}`;
      if (!forceRedraw && sig === lastDrawSignature) {
        return;
      }

      const frame = loadedFrames.get(drawableIndex);
      if (!isDecodedFrameReady(frame)) return;

      ctx.globalAlpha = 1;
      if (shouldRecolorCarBody && activePaint) {
        const tintedCanvas = getCarBodyTintedFrame(
          drawableIndex,
          frame,
          activePaint.key,
          activePaint.preset,
        );
        drawFullFrame(tintedCanvas, targetW, targetH, 1);
      } else {
        drawFullFrame(frame, targetW, targetH, 1);
      }

      lastDrawSignature = sig;
      lastDrawnFrameIndex = drawableIndex;

      if (!hasNotifiedFirstReady) {
        hasNotifiedFirstReady = true;
        container.setAttribute('data-first-frame-loaded', 'true');
        setFirstFrameReady(true);
      }

      container.setAttribute('data-rendered-frame', String(drawableIndex));
      container.setAttribute(
        'data-car-body-tinted',
        shouldRecolorCarBody ? 'true' : 'false',
      );
    };

    forceRedrawRef.current = () => {
      if (!disposed) {
        drawFrameToCanvas(currentFrameIndex, currentExactFrame, true);
      }
    };

    const pruneCache = (anchorIndex: number) => {
      const { maxCachedFrames } = getDeviceBudgets();
      if (loadedFrames.size <= maxCachedFrames) return;
      const pinned = prefersReducedMotion
        ? [...reducedMotionKeyframes, ...pinnedJunctionFrames]
        : pinnedJunctionFrames;
      const toEvict = selectFramesToEvict(
        Array.from(loadedFrames.keys()),
        anchorIndex,
        totalFrames,
        maxCachedFrames,
        pinned,
      );
      for (const idx of toEvict) {
        const evicted = loadedFrames.get(idx);
        if (evicted) {
          releaseDecodedFrame(evicted);
          loadedFrames.delete(idx);
        }
      }
    };

    const decodeImageElementFallback = (
      url: string,
      signal: AbortSignal,
    ): Promise<HTMLImageElement | null> =>
      new Promise((resolve) => {
        if (signal.aborted) {
          resolve(null);
          return;
        }
        const img = new Image();
        img.decoding = 'async';

        const cleanup = () => {
          img.onload = null;
          img.onerror = null;
          signal.removeEventListener('abort', onAbort);
        };
        const onAbort = () => {
          cleanup();
          resolve(null);
        };
        signal.addEventListener('abort', onAbort, { once: true });

        img.onload = async () => {
          try {
            if (typeof img.decode === 'function') {
              await img.decode();
            }
          } catch {
            // Drawable even if decode rejects on already-decoded image
          }
          cleanup();
          resolve(signal.aborted ? null : img);
        };
        img.onerror = () => {
          cleanup();
          resolve(null);
        };
        img.src = url;
      });

    const fetchAndDecodeFrame = async (
      index: number,
      signal: AbortSignal,
    ): Promise<DecodedFrame | null> => {
      const url = resolveSegmentFrameUrl(activeSegments, index);
      if (!url) return null;

      if (
        typeof fetch === 'function' &&
        typeof createImageBitmap === 'function'
      ) {
        try {
          const cache = await getFrameCache();
          let response: Response | undefined;
          if (cache) {
            try {
              response = await cache.match(url);
            } catch {
              response = undefined;
            }
          }
          if (!response) {
            const fetched = await fetch(url, {
              signal,
              cache: 'force-cache',
            });
            if (!fetched.ok) return null;
            if (cache) {
              void cache.put(url, fetched.clone()).catch(() => {
                // Ignore quota or private-mode Cache API failures safely
              });
            }
            response = fetched;
          }
          if (signal.aborted || disposed) return null;
          const blob = await response.blob();
          if (signal.aborted || disposed) return null;

          // On compact mobile viewports, decode directly to the optimal 16:9 tier
          // to save ~65% GPU RAM while retaining crisp 2x Retina detail.
          const target = computeOptimalVideoBufferSize(
            nativeWidth,
            nativeHeight,
            stage.clientWidth || window.innerWidth || 1440,
            stage.clientHeight || window.innerHeight || 900,
            Math.min(window.devicePixelRatio || 1, 2),
          );

          if (target.width < nativeWidth) {
            try {
              return await createImageBitmap(blob, {
                resizeWidth: target.width,
                resizeHeight: target.height,
                resizeQuality: 'high',
              });
            } catch {
              return await createImageBitmap(blob);
            }
          }
          return await createImageBitmap(blob);
        } catch (err) {
          if (
            signal.aborted ||
            (err instanceof DOMException && err.name === 'AbortError')
          ) {
            return null;
          }
          // Fall back seamlessly to HTMLImageElement decoding
        }
      }

      return decodeImageElementFallback(url, signal);
    };

    const startFrameLoad = (index: number) => {
      if (
        disposed ||
        index < 0 ||
        index >= totalFrames ||
        loadedFrames.has(index) ||
        inFlightControllers.has(index)
      ) {
        return;
      }

      const controller = new AbortController();
      inFlightControllers.set(index, controller);

      void fetchAndDecodeFrame(index, controller.signal).then((decoded) => {
        inFlightControllers.delete(index);
        if (disposed || !decoded) {
          if (decoded) releaseDecodedFrame(decoded);
          if (!disposed) pumpQueue();
          return;
        }

        // Capture native aspect ratio once from the first full-resolution frame
        if (index === 0) {
          const size = getDecodedFrameSize(decoded);
          if (size.width >= 16 && size.height >= 9) {
            const aspectRatio = size.width / size.height;
            if (Math.abs(aspectRatio - nativeWidth / nativeHeight) > 0.02) {
              nativeWidth = size.width;
              nativeHeight = size.height;
            }
          }
        }

        const existing = loadedFrames.get(index);
        if (existing) {
          releaseDecodedFrame(existing);
        }
        loadedFrames.set(index, decoded);
        pruneCache(currentFrameIndex);

        if (
          index === currentFrameIndex ||
          lastDrawnFrameIndex === -1 ||
          Math.abs(index - currentFrameIndex) <= 1 ||
          Math.abs(index - currentFrameIndex) <
            Math.abs(lastDrawnFrameIndex - currentFrameIndex)
        ) {
          drawFrameToCanvas(currentFrameIndex, currentExactFrame, true);
        }

        pumpQueue();
      });
    };

    const pumpQueue = () => {
      if (disposed) return;
      const { maxConcurrent } = getDeviceBudgets();

      while (
        inFlightControllers.size < maxConcurrent &&
        pendingQueue.length > 0
      ) {
        const nextIndex = pendingQueue.shift();
        if (nextIndex === undefined) break;
        if (loadedFrames.has(nextIndex) || inFlightControllers.has(nextIndex)) {
          continue;
        }
        startFrameLoad(nextIndex);
      }
    };

    const schedulePrefetch = (anchorIndex: number, includeInitial = false) => {
      const { aheadCount, behindCount, abortDistance } = getDeviceBudgets();
      const pinned = prefersReducedMotion
        ? reducedMotionKeyframes
        : pinnedJunctionFrames;

      // Abort stale out-of-window fetches so rapid scrolling never clogs bandwidth
      for (const [pendingIdx, controller] of inFlightControllers.entries()) {
        if (
          shouldAbortPendingFrame(
            pendingIdx,
            anchorIndex,
            abortDistance,
            pinned,
          )
        ) {
          controller.abort();
          inFlightControllers.delete(pendingIdx);
        }
      }

      const desired = prefersReducedMotion
        ? [anchorIndex, ...reducedMotionKeyframes]
        : buildPrioritizedPrefetchQueue(
            anchorIndex,
            totalFrames,
            scrollDirection,
            aheadCount,
            behindCount,
            includeInitial
              ? getInitialPreloadIndices(
                  totalFrames,
                  8,
                  pinnedJunctionFrames,
                )
              : pinnedJunctionFrames,
          );

      const seen = new Set<number>();
      pendingQueue = desired.filter((idx) => {
        if (
          idx < 0 ||
          idx >= totalFrames ||
          seen.has(idx) ||
          loadedFrames.has(idx) ||
          inFlightControllers.has(idx)
        ) {
          return false;
        }
        seen.add(idx);
        return true;
      });

      pumpQueue();
    };

    const updateFromScroll = (forceRedraw = false) => {
      rafId = null;
      if (disposed) return;

      const rect = container.getBoundingClientRect();
      const viewportH = window.innerHeight || 900;
      const progress = computeSectionScrollProgress(
        rect.top,
        rect.height,
        viewportH,
      );
      const exactFrame = progress * Math.max(0, totalFrames - 1);
      const nextFrameIndex = prefersReducedMotion
        ? resolveReducedMotionFrame(progress, totalFrames)
        : progressToFrameIndex(progress, totalFrames);

      if (Math.abs(exactFrame - currentExactFrame) > 0.05) {
        scrollDirection = exactFrame >= currentExactFrame ? 1 : -1;
      }

      currentExactFrame = exactFrame;
      currentFrameIndex = nextFrameIndex;

      container.setAttribute('data-progress', progress.toFixed(4));
      container.setAttribute('data-frame-index', String(nextFrameIndex));
      container.setAttribute('data-total-frames', String(totalFrames));
      container.setAttribute(
        'data-reduced-motion',
        prefersReducedMotion ? 'true' : 'false',
      );

      const withinBuffer =
        rect.top < viewportH * 1.5 && rect.bottom > -viewportH * 0.5;
      if (withinBuffer || isNearViewport) {
        isNearViewport = true;
        schedulePrefetch(nextFrameIndex);
      }

      drawFrameToCanvas(nextFrameIndex, exactFrame, forceRedraw);
    };

    const scheduleScrollUpdate = () => {
      if (rafId !== null || disposed) return;
      rafId = window.requestAnimationFrame(() => updateFromScroll(false));
    };

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
      lastDrawSignature = '';
      updateFromScroll(true);
    };

    reducedMotionQuery?.addEventListener('change', handleReducedMotionChange);

    // Paint frame 0 with highest priority immediately
    startFrameLoad(0);
    if (eagerPreload) {
      schedulePrefetch(0, true);
    }

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) {
                isNearViewport = true;
                schedulePrefetch(currentFrameIndex, true);
                scheduleScrollUpdate();
              }
            },
            { rootMargin: '600px 0px 600px 0px', threshold: 0 },
          )
        : null;

    observer?.observe(container);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (disposed) return;
            syncCanvasBuffer();
            updateFromScroll(true);
          })
        : null;

    resizeObserver?.observe(stage);
    resizeObserver?.observe(container);

    syncCanvasBuffer();
    ctx.fillStyle = STAGE_BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    updateFromScroll(true);

    const handleOnline = () => {
      if (disposed) return;
      schedulePrefetch(currentFrameIndex, true);
      updateFromScroll(true);
    };

    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', scheduleScrollUpdate, { passive: true });
    window.addEventListener('online', handleOnline);

    return () => {
      disposed = true;
      forceRedrawRef.current = null;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      reducedMotionQuery?.removeEventListener(
        'change',
        handleReducedMotionChange,
      );
      window.removeEventListener('scroll', scheduleScrollUpdate);
      window.removeEventListener('resize', scheduleScrollUpdate);
      window.removeEventListener('online', handleOnline);
      observer?.disconnect();
      resizeObserver?.disconnect();
      for (const controller of inFlightControllers.values()) {
        controller.abort();
      }
      inFlightControllers.clear();
      pendingQueue = [];
      for (const frame of loadedFrames.values()) {
        releaseDecodedFrame(frame);
      }
      loadedFrames.clear();
      tintedFrameCache.clear();
      rawSourcePixelCache.clear();
      compactMask = null;
      scratchSourceCanvas = null;
      liveCustomCanvas = null;
      liveCustomImageData = null;
    };
  }, [segmentsKey, totalFrames, eagerPreload]);

  return (
    <div
      ref={containerRef}
      data-testid={`scroll-video-${sequenceId}`}
      data-frame-index="0"
      data-total-frames={String(totalFrames)}
      data-progress="0.0000"
      data-first-frame-loaded={firstFrameReady ? 'true' : 'false'}
      data-wrap-colour={activeCustomWrapHex ?? activeWrapColourId ?? 'none'}
      data-car-body-tinted="false"
      data-object-fit="contain"
      data-video-aspect="16:9"
      aria-label={ariaLabel}
      className="relative z-10 bg-[#060607]"
    >
      {/* Single Continuous Pinned Full-Viewport Contain-Mode Frame Canvas Stage */}
      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[#060607] pointer-events-none select-none flex items-center justify-center"
      >
        {/* Zero-flash initial poster matching exact object-fit: contain & object-position: center until frame 0 paints */}
        {firstFrameUrl && !firstFrameReady && (
          <img
            src={firstFrameUrl}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 z-[1] block h-full w-full object-contain object-center select-none pointer-events-none"
            style={{ objectFit: 'contain', objectPosition: 'center' }}
          />
        )}

        <canvas
          ref={canvasRef}
          data-testid={`scroll-video-canvas-${sequenceId}`}
          aria-hidden="true"
          width={DEFAULT_NATIVE_WIDTH}
          height={DEFAULT_NATIVE_HEIGHT}
          className="block h-full w-full object-contain object-center"
          style={{ objectFit: 'contain', objectPosition: 'center' }}
        />

        {/* Subtle Top & Bottom Obsidian Seam Blending */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-[2] h-20 bg-gradient-to-b from-[#060607]/80 via-[#060607]/25 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 z-[2] h-24 bg-gradient-to-t from-[#060607]/85 via-[#060607]/25 to-transparent"
        />

        {/* Gentle Outer-Margin Vignette for Floating Glass Card Legibility (Center Unobstructed) */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute inset-0 z-[2]"
          style={{
            background:
              'linear-gradient(90deg, rgba(6,6,7,0.38) 0%, rgba(6,6,7,0.08) 22%, rgba(6,6,7,0) 50%, rgba(6,6,7,0.08) 78%, rgba(6,6,7,0.38) 100%)',
          }}
        />
      </div>

      {/* Scroll-Triggered Waypoint Overlays Riding Continuously Over One Pinned Stage */}
      <div className="relative z-10 -mt-[100svh]">{children}</div>
    </div>
  );
}
