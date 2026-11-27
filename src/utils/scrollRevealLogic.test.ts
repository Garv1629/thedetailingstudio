import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CARD_REVEAL_OFFSET_PX,
  SERVICE_CROSSFADE_SPRING,
  computeServiceCrossfadeState,
  formatCrossfadeBlurFilter,
  getCardRevealMotion,
  resolveRevealState,
  shouldRevealImmediately,
} from './scrollRevealLogic';

test('cards reveal immediately when reduced motion is enabled or IntersectionObserver is missing', () => {
  assert.equal(shouldRevealImmediately(true, true), true);
  assert.equal(shouldRevealImmediately(false, false), true);
  assert.equal(shouldRevealImmediately(false, true), false);
});

test('reveal state latches to true once a card enters the viewport', () => {
  assert.equal(resolveRevealState(false, false, false), false);
  assert.equal(resolveRevealState(false, true, false), true);
  // Once revealed, leaving the viewport should keep the card visible
  assert.equal(resolveRevealState(true, false, false), true);
  // Reduced motion always resolves as visible
  assert.equal(resolveRevealState(false, false, true), true);
});

test('card motion maps hidden and revealed states to subtle fade-in and slide-up values', () => {
  assert.deepEqual(getCardRevealMotion(false, false), {
    revealed: false,
    opacity: 0,
    translateY: CARD_REVEAL_OFFSET_PX,
  });

  assert.deepEqual(getCardRevealMotion(true, false), {
    revealed: true,
    opacity: 1,
    translateY: 0,
  });

  assert.deepEqual(getCardRevealMotion(false, true), {
    revealed: true,
    opacity: 1,
    translateY: 0,
  });
});

test('computeServiceCrossfadeState smoothly cross-fades across entering, active, and exiting phases', () => {
  // Before entering viewport -> dissolved and offset from left margin
  const beforeEnter = computeServiceCrossfadeState(0.02, 'left');
  assert.equal(beforeEnter.phase, 'entering');
  assert.equal(beforeEnter.opacity, 0);
  assert.ok(beforeEnter.y > 20);
  assert.ok(beforeEnter.x < 0);
  assert.ok(beforeEnter.blurPx > 4);

  // Mid-enter -> partial opacity and smooth lateral settle
  const midEnter = computeServiceCrossfadeState(0.18, 'right');
  assert.equal(midEnter.phase, 'entering');
  assert.ok(midEnter.opacity > 0.25 && midEnter.opacity < 0.75);
  assert.ok(midEnter.x > 0 && midEnter.x < 16);

  // Center reading plateau (including scrollIntoView landing ~0.455) -> full crisp clarity
  const activeCenter = computeServiceCrossfadeState(0.455, 'right');
  assert.equal(activeCenter.phase, 'active');
  assert.equal(activeCenter.opacity, 1);
  assert.equal(activeCenter.x, 0);
  assert.equal(activeCenter.scale, 1);
  assert.equal(activeCenter.blurPx, 0);
  assert.equal(formatCrossfadeBlurFilter(activeCenter.blurPx), 'none');

  // Mid-exit -> smoothly dissolving upward while overlapping next card entry
  const midExit = computeServiceCrossfadeState(0.71, 'left');
  assert.equal(midExit.phase, 'exiting');
  assert.ok(midExit.opacity > 0.2 && midExit.opacity < 0.8);
  assert.ok(midExit.y < -10);
  assert.ok(midExit.blurPx > 0);
  assert.ok(formatCrossfadeBlurFilter(midExit.blurPx).startsWith('blur('));

  // Past exit -> fully dissolved
  const afterExit = computeServiceCrossfadeState(0.95, 'left');
  assert.equal(afterExit.phase, 'exiting');
  assert.equal(afterExit.opacity, 0);
});

test('computeServiceCrossfadeState creates balanced overlapping cross-fade between adjacent cards', () => {
  // Across consecutive 120svh waypoints, when card N is exiting (~0.71),
  // card N+1 sits around ~0.18 entering — producing a seamless cross-fade handoff.
  const outgoing = computeServiceCrossfadeState(0.71, 'left');
  const incoming = computeServiceCrossfadeState(0.18, 'right');

  assert.equal(outgoing.phase, 'exiting');
  assert.equal(incoming.phase, 'entering');
  const combinedOpacity = outgoing.opacity + incoming.opacity;
  assert.ok(combinedOpacity > 0.75 && combinedOpacity < 1.25);
});

test('computeServiceCrossfadeState widens active reading band when expanded and bypasses motion for reduced motion', () => {
  // At 0.72 a collapsed card is exiting, while an expanded card stays at full clarity
  const collapsedAt72 = computeServiceCrossfadeState(0.72, 'right', {
    expandedBlend: 0,
  });
  const expandedAt72 = computeServiceCrossfadeState(0.72, 'right', {
    expandedBlend: 1,
  });
  assert.equal(collapsedAt72.phase, 'exiting');
  assert.ok(collapsedAt72.opacity < 0.6);
  assert.equal(expandedAt72.phase, 'active');
  assert.equal(expandedAt72.opacity, 1);
  assert.equal(expandedAt72.y, 0);

  // Reduced motion keeps card permanently crisp and stationary
  const reduced = computeServiceCrossfadeState(0.02, 'left', {
    prefersReducedMotion: true,
  });
  assert.deepEqual(reduced, {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    blurPx: 0,
    phase: 'active',
  });

  assert.ok(SERVICE_CROSSFADE_SPRING.stiffness > 0);
  assert.ok(SERVICE_CROSSFADE_SPRING.damping > 0);
});
