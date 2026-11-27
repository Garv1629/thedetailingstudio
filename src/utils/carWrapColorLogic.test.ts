import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAR_WRAP_PAINT_PRESETS,
  isSkinOrWarmNonPaintPixel,
  recolorCarBodyPixel,
} from './carWrapColorLogic';

test('recolorCarBodyPixel leaves unmasked studio wall, wheel, and outside pixels completely untouched', () => {
  const result = recolorCarBodyPixel(
    90,
    92,
    94,
    0,
    CAR_WRAP_PAINT_PRESETS['racing-green'],
  );
  assert.deepEqual(result, [90, 92, 94]);
});

test('recolorCarBodyPixel preserves technician skin tones and ruby taillights even inside mask bounds', () => {
  // Technician forearm skin tone
  assert.equal(isSkinOrWarmNonPaintPixel(158, 118, 92), true);
  assert.deepEqual(
    recolorCarBodyPixel(
      158,
      118,
      92,
      1,
      CAR_WRAP_PAINT_PRESETS['racing-green'],
    ),
    [158, 118, 92],
  );

  // Red taillight / reflector
  assert.equal(isSkinOrWarmNonPaintPixel(120, 26, 24), true);
  assert.deepEqual(
    recolorCarBodyPixel(120, 26, 24, 1, CAR_WRAP_PAINT_PRESETS.papaya),
    [120, 26, 24],
  );
});

test('recolorCarBodyPixel tints neutral metallic car body paint into deep refined wrap finishes while preserving pure white reflections and obsidian crevices', () => {
  // Neutral mid-tone satin charcoal fender pixel
  const [gR, gG, gB] = recolorCarBodyPixel(
    78,
    80,
    82,
    1,
    CAR_WRAP_PAINT_PRESETS['racing-green'],
  );
  assert.ok(gG > gR + 25 && gG > gB + 12, 'Should shift strongly to emerald');
  assert.ok(gG < 140, 'Should stay deep and sophisticated, not neon');

  const [pR, pG, pB] = recolorCarBodyPixel(
    78,
    80,
    82,
    1,
    CAR_WRAP_PAINT_PRESETS.papaya,
  );
  assert.ok(pR > pG + 35 && pR > pB + 50, 'Should shift cleanly to burnt papaya');

  // Pure white LED reflection stays bright neutral white
  const [hR, hG, hB] = recolorCarBodyPixel(
    244,
    245,
    246,
    1,
    CAR_WRAP_PAINT_PRESETS['racing-green'],
  );
  assert.ok(hR > 235 && hG > 235 && hB > 235);

  // Deep shadow gap stays dark obsidian
  const [sR, sG, sB] = recolorCarBodyPixel(
    8,
    9,
    10,
    1,
    CAR_WRAP_PAINT_PRESETS.papaya,
  );
  assert.deepEqual([sR, sG, sB], [8, 9, 10]);
});

test('hsvToRgb, rgbToHsv, rgbToHex, and parseHexColor round-trip accurately', async () => {
  const {
    hsvToRgb,
    rgbToHsv,
    rgbToHex,
    parseHexColor,
    wheelPointToHueSat,
    hueSatToWheelPoint,
    buildCustomWrapPaintPreset,
    resolveActiveWrapPaint,
  } = await import('./carWrapColorLogic');

  assert.deepEqual(hsvToRgb(0, 1, 1), [255, 0, 0]);
  assert.deepEqual(hsvToRgb(120, 1, 1), [0, 255, 0]);
  assert.deepEqual(hsvToRgb(240, 1, 1), [0, 0, 255]);

  const hsv = rgbToHsv(24, 110, 76);
  const roundTripped = hsvToRgb(hsv.h, hsv.s, hsv.v);
  assert.ok(Math.abs(roundTripped[0] - 24) <= 1);
  assert.ok(Math.abs(roundTripped[1] - 110) <= 1);
  assert.ok(Math.abs(roundTripped[2] - 76) <= 1);

  assert.equal(rgbToHex(24, 110, 76), '#186E4C');
  assert.deepEqual(parseHexColor('#186e4c'), [24, 110, 76]);
  assert.deepEqual(parseHexColor('#abc'), [170, 187, 204]);
  assert.equal(parseHexColor('not-a-color'), null);

  // Wheel point -> HSV -> wheel point round trip
  const point = hueSatToWheelPoint(215, 0.72, 54);
  const back = wheelPointToHueSat(point.x - 54, point.y - 54, 54);
  assert.ok(Math.abs(back.h - 215) < 0.5);
  assert.ok(Math.abs(back.s - 0.72) < 0.01);

  // Outside wheel boundary clamps saturation to 1
  const clamped = wheelPointToHueSat(120, 0, 54);
  assert.equal(clamped.s, 1);
  assert.equal(clamped.h, 0);

  // Custom cobalt blue wrap recolors neutral fender panel strongly blue while keeping skin untouched
  const customResolved = resolveActiveWrapPaint('racing-green', '#1E4DB7');
  assert.ok(customResolved);
  assert.equal(customResolved.key, 'custom:#1E4DB7');
  const [bR, bG, bB] = recolorCarBodyPixel(
    78,
    80,
    82,
    1,
    customResolved.preset,
  );
  assert.ok(bB > bR + 55 && bB > bG + 30, 'Should shift car body to cobalt blue');

  // Skin remains completely untouched with custom wrap preset
  assert.deepEqual(
    recolorCarBodyPixel(
      158,
      118,
      92,
      1,
      buildCustomWrapPaintPreset([190, 28, 120]),
    ),
    [158, 118, 92],
  );
});
