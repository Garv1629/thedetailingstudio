import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleMapsDirectionsUrl,
  buildWhatsAppConciergeUrl,
  computeCardParallaxOffset,
  computeMagneticOffset,
  computeSpecularCoordinates,
  shouldSkipIntroCurtain,
} from './luxuryMotionLogic';

test('computeMagneticOffset clamps pointer pull symmetrically and respects disabled state', () => {
  const rect = { left: 100, top: 200, width: 200, height: 50 };

  assert.deepEqual(computeMagneticOffset(200, 225, rect, 6, false), {
    x: 0,
    y: 0,
  });
  assert.deepEqual(computeMagneticOffset(300, 250, rect, 6, false), {
    x: 6,
    y: 6,
  });
  assert.deepEqual(computeMagneticOffset(0, 0, rect, 6, false), {
    x: -6,
    y: -6,
  });
  assert.deepEqual(computeMagneticOffset(300, 250, rect, 6, true), {
    x: 0,
    y: 0,
  });
});

test('computeCardParallaxOffset produces bounded depth drift centered on the viewport', () => {
  assert.equal(computeCardParallaxOffset(450, 900, 16, false), 0);
  assert.equal(computeCardParallaxOffset(1400, 900, 16, false), 16);
  assert.equal(computeCardParallaxOffset(-500, 900, 16, false), -16);
  assert.equal(computeCardParallaxOffset(1400, 900, 16, true), 0);
});

test('computeSpecularCoordinates normalizes pointer location to 0-100 percentages', () => {
  const rect = { left: 50, top: 100, width: 300, height: 60 };
  assert.deepEqual(computeSpecularCoordinates(200, 130, rect), {
    xPct: 50,
    yPct: 50,
  });
  assert.deepEqual(computeSpecularCoordinates(50, 100, rect), {
    xPct: 0,
    yPct: 0,
  });
  assert.deepEqual(computeSpecularCoordinates(400, 200, rect), {
    xPct: 100,
    yPct: 100,
  });
});

test('shouldSkipIntroCurtain skips for reduced motion or autostart=1 query param', () => {
  assert.equal(shouldSkipIntroCurtain(true, ''), true);
  assert.equal(shouldSkipIntroCurtain(false, '?autostart=1'), true);
  assert.equal(shouldSkipIntroCurtain(false, '?foo=bar&autostart=1'), true);
  assert.equal(shouldSkipIntroCurtain(false, ''), false);
});

test('concierge and directions URL builders encode Greater Noida studio links safely', () => {
  const waUrl = buildWhatsAppConciergeUrl(
    '+91 81918 11100',
    'Hello, I would like to book an inspection.',
  );
  assert.equal(
    waUrl,
    'https://wa.me/918191811100?text=Hello%2C%20I%20would%20like%20to%20book%20an%20inspection.',
  );

  const mapsUrl = buildGoogleMapsDirectionsUrl(
    'The Detailing Studio, Plot No 204, Zeta I, Greater Noida',
  );
  assert.ok(
    mapsUrl.startsWith('https://www.google.com/maps/search/?api=1&query='),
  );
  assert.ok(mapsUrl.includes('Plot%20No%20204'));
});
