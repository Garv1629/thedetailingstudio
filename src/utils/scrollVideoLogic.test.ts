import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPrioritizedPrefetchQueue,
  computeBoundaryCrossfade,
  computeContainDrawRect,
  computeOptimalVideoBufferSize,
  computeSectionScrollProgress,
  findNearestLoadedFrame,
  formatFrameUrl,
  getInitialPreloadIndices,
  getPrefetchFrameIndices,
  getTotalSegmentFrames,
  progressToFrameIndex,
  resolveReducedMotionFrame,
  resolveSegmentFrameUrl,
  selectFramesToEvict,
  shouldAbortPendingFrame,
  type VideoSequenceSegment,
} from './scrollVideoLogic';

const CONTINUOUS_SEGMENTS: VideoSequenceSegment[] = [
  { basePath: '/assets/detailing/video-01/frames', frameCount: 120 },
  { basePath: '/assets/detailing/video-02/frames', frameCount: 120 },
];

test('computeSectionScrollProgress maps pinned scroll range strictly to [0, 1]', () => {
  assert.equal(computeSectionScrollProgress(240, 2600, 900), 0);
  assert.equal(computeSectionScrollProgress(0, 2600, 900), 0);
  assert.equal(computeSectionScrollProgress(-850, 2600, 900), 0.5);
  assert.equal(computeSectionScrollProgress(-1700, 2600, 900), 1);
  assert.equal(computeSectionScrollProgress(-2100, 2600, 900), 1);
});

test('progressToFrameIndex advances forward, reverses smoothly, and clamps ends across 240 continuous frames', () => {
  assert.equal(progressToFrameIndex(0, 240), 0);
  assert.equal(progressToFrameIndex(-0.4, 240), 0);
  assert.equal(progressToFrameIndex(0.5, 240), 120);
  assert.equal(progressToFrameIndex(1, 240), 239);
  assert.equal(progressToFrameIndex(1.5, 240), 239);

  const f1 = progressToFrameIndex(0.2, 240);
  const f2 = progressToFrameIndex(0.75, 240);
  const f3 = progressToFrameIndex(0.45, 240);
  assert.ok(f2 > f1);
  assert.ok(f3 < f2 && f3 > f1);
});

test('formatFrameUrl and resolveSegmentFrameUrl seamlessly bridge Video 1 and Video 2', () => {
  assert.equal(getTotalSegmentFrames(CONTINUOUS_SEGMENTS), 240);
  assert.equal(
    formatFrameUrl('/assets/detailing/video-01/frames', 0),
    '/assets/detailing/video-01/frames/frame_00001.webp',
  );
  assert.equal(
    resolveSegmentFrameUrl(CONTINUOUS_SEGMENTS, 0),
    '/assets/detailing/video-01/frames/frame_00001.webp',
  );
  assert.equal(
    resolveSegmentFrameUrl(CONTINUOUS_SEGMENTS, 119),
    '/assets/detailing/video-01/frames/frame_00120.webp',
  );
  assert.equal(
    resolveSegmentFrameUrl(CONTINUOUS_SEGMENTS, 120),
    '/assets/detailing/video-02/frames/frame_00001.webp',
  );
  assert.equal(
    resolveSegmentFrameUrl(CONTINUOUS_SEGMENTS, 239),
    '/assets/detailing/video-02/frames/frame_00120.webp',
  );
});

test('computeBoundaryCrossfade dissolves smoothly only at the Video 1 to Video 2 seam', () => {
  assert.equal(computeBoundaryCrossfade(60, CONTINUOUS_SEGMENTS), null);
  assert.equal(computeBoundaryCrossfade(180, CONTINUOUS_SEGMENTS), null);

  const midBlend = computeBoundaryCrossfade(119.5, CONTINUOUS_SEGMENTS);
  assert.ok(midBlend !== null);
  assert.equal(midBlend.fromIndex, 119);
  assert.equal(midBlend.toIndex, 120);
  assert.ok(Math.abs(midBlend.alpha - 0.5) < 0.001);
});

test('computeContainDrawRect preserves 16:9 aspect ratio with zero cropping or stretching', () => {
  const desktop = computeContainDrawRect(1440, 810, 1440, 900);
  assert.equal(desktop.dw, 1440);
  assert.equal(desktop.dh, 810);
  assert.equal(desktop.dx, 0);
  assert.equal(desktop.dy, 45);

  const mobile = computeContainDrawRect(1440, 810, 390, 844);
  assert.equal(mobile.dw, 390);
  assert.ok(Math.abs(mobile.dh - 219.375) < 0.001);
  assert.equal(mobile.dx, 0);
  assert.ok(mobile.dy > 300);

  const ultrawide = computeContainDrawRect(1440, 810, 2560, 900);
  assert.equal(ultrawide.dh, 900);
  assert.equal(ultrawide.dw, 1600);
  assert.equal(ultrawide.dx, 480);
  assert.equal(ultrawide.dy, 0);
});

test('computeOptimalVideoBufferSize preserves exact 16:9 ratio and resists mobile URL-bar jitter', () => {
  const desktop = computeOptimalVideoBufferSize(1440, 810, 1440, 900, 2);
  assert.equal(desktop.width, 1440);
  assert.equal(desktop.height, 810);

  const mobileTall = computeOptimalVideoBufferSize(1440, 810, 390, 844, 2);
  const mobileBarCollapsed = computeOptimalVideoBufferSize(1440, 810, 390, 780, 2);
  assert.deepEqual(mobileTall, mobileBarCollapsed);
  assert.equal(mobileTall.width, 800);
  assert.equal(mobileTall.height, 450);
  assert.ok(Math.abs(mobileTall.width / mobileTall.height - 16 / 9) < 0.001);
});

test('prefetch window, directional queue, and stale abort guard keep scrubbing responsive', () => {
  const initial = getInitialPreloadIndices(240, 10, [119, 120]);
  assert.deepEqual(initial, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 239, 119, 120]);

  const windowIndices = getPrefetchFrameIndices(118, 240, 4, 2);
  assert.equal(windowIndices[0], 118);
  assert.ok(windowIndices.includes(120));
  assert.ok(windowIndices.includes(122));

  const reverseQueue = buildPrioritizedPrefetchQueue(80, 240, -1, 4, 2, [119, 120]);
  assert.equal(reverseQueue[0], 80);
  assert.equal(reverseQueue[1], 79);
  assert.equal(reverseQueue[2], 81);
  assert.ok(reverseQueue.includes(76));
  assert.ok(!reverseQueue.includes(84));

  assert.equal(shouldAbortPendingFrame(10, 90, 24, [119, 120]), true);
  assert.equal(shouldAbortPendingFrame(119, 10, 24, [119, 120]), false);
  assert.equal(shouldAbortPendingFrame(0, 180, 24, [119, 120]), false);
  assert.equal(shouldAbortPendingFrame(82, 90, 24, [119, 120]), false);

  const loaded = new Set([0, 1, 2, 119, 120]);
  assert.equal(
    findNearestLoadedFrame(118, (idx) => loaded.has(idx), 240),
    119,
  );
  assert.equal(findNearestLoadedFrame(50, () => false, 240), null);
});

test('selectFramesToEvict bounds memory while preserving boundary, junction, and active frames', () => {
  const cached = Array.from({ length: 70 }, (_, i) => i + 80);
  cached.unshift(0);
  const evicted = selectFramesToEvict(cached, 140, 240, 56, [119, 120]);
  assert.equal(evicted.length, 15);
  assert.ok(!evicted.includes(0));
  assert.ok(!evicted.includes(119));
  assert.ok(!evicted.includes(120));
  assert.ok(!evicted.includes(140));
});

test('resolveReducedMotionFrame snaps calmly to discrete chapter keyframes', () => {
  assert.equal(resolveReducedMotionFrame(0, 240), 0);
  assert.equal(resolveReducedMotionFrame(0.1, 240), 0);
  const mid = resolveReducedMotionFrame(0.35, 240);
  const late = resolveReducedMotionFrame(0.65, 240);
  const wrap = resolveReducedMotionFrame(0.95, 240);
  assert.ok(mid > 0 && mid < late);
  assert.ok(late < wrap && wrap >= 210);
});
