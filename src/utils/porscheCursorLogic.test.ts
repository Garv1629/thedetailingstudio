import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTouchOffsetPosition,
  isInteractiveElementDescriptor,
  shouldYieldToNativeCursor,
  stepCursorPhysics,
  type CursorPhysicsState,
} from './porscheCursorLogic';

test('stepCursorPhysics glides smoothly, flips facing direction with hysteresis, and clamps tilt', () => {
  const initial: CursorPhysicsState = {
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    facing: 1,
    tiltDeg: 0,
  };

  // Moving strongly right should flip sprite to face right (-1)
  const rightStep = stepCursorPhysics(initial, {
    targetX: 260,
    targetY: 110,
    smoothing: 0.25,
  });
  assert.ok(rightStep.x > 100 && rightStep.x < 260);
  assert.equal(rightStep.facing, -1);
  assert.ok(Math.abs(rightStep.tiltDeg) <= 11);

  // Tiny jitter leftward below hysteresis threshold preserves facing direction
  const microJitter = stepCursorPhysics(rightStep, {
    targetX: rightStep.x - 1,
    targetY: rightStep.y,
    smoothing: 0.25,
  });
  assert.equal(microJitter.facing, -1);

  // Moving decisively left flips sprite back to native left-facing (1)
  const leftStep = stepCursorPhysics(rightStep, {
    targetX: 20,
    targetY: 90,
    smoothing: 0.25,
  });
  assert.equal(leftStep.facing, 1);

  // Reduced motion snaps cleanly with zero tilt
  const reduced = stepCursorPhysics(initial, {
    targetX: 300,
    targetY: 200,
    reducedMotion: true,
  });
  assert.equal(reduced.x, 300);
  assert.equal(reduced.y, 200);
  assert.equal(reduced.tiltDeg, 0);
  assert.equal(reduced.facing, -1);
});

test('computeTouchOffsetPosition places car above finger and clamps safely inside mobile viewport', () => {
  const normal = computeTouchOffsetPosition(195, 420, 390, 844, 38);
  assert.equal(normal.x, 195);
  assert.equal(normal.y, 382);

  const nearTopEdge = computeTouchOffsetPosition(5, 10, 390, 844, 38);
  assert.equal(nearTopEdge.x, 28);
  assert.equal(nearTopEdge.y, 24);
});

test('interactive and native-cursor descriptors classify controls accurately', () => {
  assert.equal(isInteractiveElementDescriptor({ tagName: 'BUTTON' }), true);
  assert.equal(isInteractiveElementDescriptor({ tagName: 'A' }), true);
  assert.equal(
    isInteractiveElementDescriptor({ tagName: 'DIV', role: 'application' }),
    true,
  );
  assert.equal(isInteractiveElementDescriptor({ tagName: 'P' }), false);

  assert.equal(shouldYieldToNativeCursor({ tagName: 'IFRAME' }), true);
  assert.equal(
    shouldYieldToNativeCursor({ tagName: 'INPUT', type: 'email' }),
    true,
  );
  assert.equal(
    shouldYieldToNativeCursor({ tagName: 'INPUT', type: 'range' }),
    false,
  );
  assert.equal(shouldYieldToNativeCursor({ tagName: 'BUTTON' }), false);
});
