import type { WrapColourId } from '../data/atelierData';

export interface CarWrapPaintPreset {
  rgb: [number, number, number];
  lumGain: number;
  lumLift: number;
  strength: number;
}

/**
 * Refined, dark-UI-calibrated automotive wrap pigments designed to recolor ONLY
 * the vehicle's painted/wrapped body panels while preserving specular highlights,
 * shadows, technician skin tones, alloy wheels, taillights, glass, and studio walls.
 */
export const CAR_WRAP_PAINT_PRESETS: Record<WrapColourId, CarWrapPaintPreset> = {
  'racing-green': {
    rgb: [24, 110, 76],
    lumGain: 1.12,
    lumLift: 0.05,
    strength: 0.88,
  },
  papaya: {
    rgb: [196, 86, 36],
    lumGain: 1.14,
    lumLift: 0.05,
    strength: 0.86,
  },
  'liquid-chrome': {
    rgb: [168, 184, 204],
    lumGain: 1.24,
    lumLift: 0.09,
    strength: 0.72,
  },
  'nardo-grey': {
    rgb: [132, 142, 154],
    lumGain: 1.18,
    lumLift: 0.07,
    strength: 0.78,
  },
  'pearl-white': {
    rgb: [226, 220, 208],
    lumGain: 1.32,
    lumLift: 0.14,
    strength: 0.76,
  },
};

/**
 * Global frame index where the Porsche wrap application shot starts inside the
 * continuous 240-frame sequence (Video 2 frame_00110.webp => global index 229).
 */
export const WRAP_SHOT_START_FRAME = 229;

export interface HsvColor {
  /** Hue in degrees [0, 360) */
  h: number;
  /** Saturation in [0, 1] */
  s: number;
  /** Value / brightness in [0, 1] */
  v: number;
}

export function hsvToRgb(
  h: number,
  s: number,
  v: number,
): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp01(s);
  const val = clamp01(v);

  const c = val * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = val - c;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hue < 60) {
    rPrime = c;
    gPrime = x;
  } else if (hue < 120) {
    rPrime = x;
    gPrime = c;
  } else if (hue < 180) {
    gPrime = c;
    bPrime = x;
  } else if (hue < 240) {
    gPrime = x;
    bPrime = c;
  } else if (hue < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

  return [
    Math.round((rPrime + m) * 255),
    Math.round((gPrime + m) * 255),
    Math.round((bPrime + m) * 255),
  ];
}

export function rgbToHsv(r: number, g: number, b: number): HsvColor {
  const rn = clamp01(r / 255);
  const gn = clamp01(g / 255);
  const bn = clamp01(b / 255);

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta > 1e-6) {
    if (max === rn) {
      h = 60 * (((gn - bn) / delta) % 6);
    } else if (max === gn) {
      h = 60 * ((bn - rn) / delta + 2);
    } else {
      h = 60 * ((rn - gn) / delta + 4);
    }
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  return { h, s, v: max };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) =>
    Math.min(255, Math.max(0, Math.round(value)))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function parseHexColor(hex: string): [number, number, number] | null {
  const cleaned = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return [r, g, b];
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

/**
 * Converts a point offset (dx, dy) from the center of a color wheel into
 * Hue [0, 360) and Saturation [0, 1], clamped neatly inside the circle.
 */
export function wheelPointToHueSat(
  dx: number,
  dy: number,
  radius: number,
): { h: number; s: number } {
  if (radius <= 0) return { h: 0, s: 0 };
  const dist = Math.hypot(dx, dy);
  const s = clamp01(dist / radius);
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const h = ((angleDeg % 360) + 360) % 360;
  return { h, s };
}

/**
 * Converts Hue [0, 360) and Saturation [0, 1] into pixel coordinates relative
 * to the top-left of a square color wheel of diameter `2 * radius`.
 */
export function hueSatToWheelPoint(
  h: number,
  s: number,
  radius: number,
): { x: number; y: number } {
  const rad = (h * Math.PI) / 180;
  const r = clamp01(s) * radius;
  return {
    x: radius + Math.cos(rad) * r,
    y: radius + Math.sin(rad) * r,
  };
}

/**
 * Builds an automotive-calibrated CarWrapPaintPreset for any custom RGB color
 * chosen on the color wheel so dark metallic charcoal bodywork shifts cleanly
 * into deep, luminous, or pearl finishes while preserving studio reflections.
 */
export function buildCustomWrapPaintPreset(
  rgb: [number, number, number],
): CarWrapPaintPreset {
  const [r, g, b] = rgb;
  const targetLum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

  // Lift luminance smoothly for pearl/silver/bright shades while keeping deep shades sculptural
  const lumGain = Number((1.08 + targetLum * 0.24).toFixed(3));
  const lumLift = Number((0.035 + targetLum * 0.11).toFixed(3));
  const strength = Number(
    clamp01(0.76 + sat * 0.14 - Math.max(0, targetLum - 0.78) * 0.12).toFixed(3),
  );

  return {
    rgb: [
      Math.min(255, Math.max(0, Math.round(r))),
      Math.min(255, Math.max(0, Math.round(g))),
      Math.min(255, Math.max(0, Math.round(b))),
    ],
    lumGain,
    lumLift,
    strength,
  };
}

/**
 * Resolves the active CarWrapPaintPreset and cache key from either a custom
 * hex shade (from the color wheel) or a named Atelier preset.
 */
export function resolveActiveWrapPaint(
  wrapColourId: WrapColourId | null,
  customWrapHex: string | null,
): { key: string; preset: CarWrapPaintPreset } | null {
  if (customWrapHex) {
    const parsed = parseHexColor(customWrapHex);
    if (parsed) {
      const normalizedHex = rgbToHex(parsed[0], parsed[1], parsed[2]);
      return {
        key: `custom:${normalizedHex}`,
        preset: buildCustomWrapPaintPreset(parsed),
      };
    }
  }
  if (wrapColourId) {
    const preset = CAR_WRAP_PAINT_PRESETS[wrapColourId];
    if (preset) {
      return { key: `preset:${wrapColourId}`, preset };
    }
  }
  return null;
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Detects human skin tones and warm non-paint objects (e.g. technician's forearm/face,
 * gold Porsche wheel crest) so they are never tinted by car-body wrap recoloring.
 */
export function isSkinOrWarmNonPaintPixel(
  r: number,
  g: number,
  b: number,
): boolean {
  // Human skin & warm beige/gold tones
  if (r > g + 6 && g > b + 4 && r - b > 18 && r > 58) {
    return true;
  }
  // Ruby-red taillight & rear bumper reflector
  if (r - g > 20 && r - b > 20 && r > 48) {
    return true;
  }
  return false;
}

/**
 * Recolors a single pixel belonging to the masked vehicle body while preserving:
 * - Natural technician skin tones & red taillights
 * - Crisp white studio LED reflections on the clearcoat
 * - Deep obsidian panel gaps, rubber seals, gloves, and heat gun
 */
export function recolorCarBodyPixel(
  r: number,
  g: number,
  b: number,
  maskAlpha: number,
  preset: CarWrapPaintPreset,
): [number, number, number] {
  if (maskAlpha <= 0.01) {
    return [r, g, b];
  }

  if (isSkinOrWarmNonPaintPixel(r, g, b)) {
    return [r, g, b];
  }

  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  const chroma = (maxChannel - minChannel) / 255;

  // Strongly attenuate already-chromatic pixels (blue caliper, red accents, etc.)
  const neutralWeight = clamp01(1 - (chroma - 0.06) / 0.1);
  if (neutralWeight <= 0.01) {
    return [r, g, b];
  }

  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  // Keep deep crevices/black gloves dark and crisp white studio LED streaks pure white
  const shadowWeight = smoothstep(0.055, 0.16, lum);
  const highlightWeight = 1 - smoothstep(0.76, 0.94, lum);

  const blendWeight = clamp01(
    maskAlpha * neutralWeight * shadowWeight * highlightWeight * preset.strength,
  );
  if (blendWeight <= 0.005) {
    return [r, g, b];
  }

  const shadedLum = Math.min(1, lum * preset.lumGain + preset.lumLift);
  const lightFactor = 0.26 + shadedLum * 1.16;

  const targetR = Math.min(255, preset.rgb[0] * lightFactor);
  const targetG = Math.min(255, preset.rgb[1] * lightFactor);
  const targetB = Math.min(255, preset.rgb[2] * lightFactor);

  return [
    Math.round(r + (targetR - r) * blendWeight),
    Math.round(g + (targetG - g) * blendWeight),
    Math.round(b + (targetB - b) * blendWeight),
  ];
}

/**
 * Normalized silhouette mask geometry for the Porsche rear quarter panel & bumper
 * in Video 2's locked-camera wrap sequence (frames 229..239).
 * Excludes studio walls, rear glass window, alloy wheel/tire arch, taillight bar,
 * lower matte diffuser, and technician.
 */
export const PORSCHE_WRAP_MASK_GEOMETRY = {
  bodyPolygon: [
    [0.0, 0.0],
    [0.24, 0.0],
    [0.42, 0.08],
    [0.57, 0.17],
    [0.68, 0.25],
    [0.75, 0.32],
    [0.835, 0.43],
    [0.865, 0.56],
    [0.855, 0.71],
    [0.805, 0.85],
    [0.72, 0.94],
    [0.52, 0.95],
    [0.46, 0.92],
    [0.0, 0.92],
  ] as ReadonlyArray<readonly [number, number]>,
  windowCutout: [
    [0.0, 0.03],
    [0.14, 0.06],
    [0.27, 0.12],
    [0.33, 0.175],
    [0.3, 0.215],
    [0.17, 0.245],
    [0.0, 0.265],
  ] as ReadonlyArray<readonly [number, number]>,
  wheelArchCutout: {
    cx: 0.242,
    cy: 0.915,
    rx: 0.262,
    ry: 0.415,
  },
  taillightCutout: [
    [0.565, 0.415],
    [0.825, 0.375],
    [0.85, 0.455],
    [0.7, 0.485],
    [0.58, 0.47],
  ] as ReadonlyArray<readonly [number, number]>,
  lowerDiffuserCutout: [
    [0.54, 0.855],
    [0.8, 0.82],
    [0.8, 1.0],
    [0.52, 1.0],
  ] as ReadonlyArray<readonly [number, number]>,
} as const;
