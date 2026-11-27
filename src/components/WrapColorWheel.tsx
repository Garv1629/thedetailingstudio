import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  WRAP_COLOURS,
  type WrapColourId,
} from '../data/atelierData';
import {
  hsvToRgb,
  hueSatToWheelPoint,
  rgbToHex,
  rgbToHsv,
  wheelPointToHueSat,
} from '../utils/carWrapColorLogic';

interface WrapColorWheelProps {
  /** Currently active RGB displayed on the wheel (from active preset or custom hex) */
  activeRgb: [number, number, number];
  /** Currently selected named preset id */
  selectedWrapId: WrapColourId;
  /** True when user has dialed a bespoke custom shade rather than a preset */
  isCustomActive: boolean;
  /** Select one of the signature preset finishes */
  onSelectWrap: (colourId: WrapColourId) => void;
  /** Invoked continuously as user drags the wheel or tone slider */
  onCustomColorChange: (hex: string) => void;
}

const WHEEL_SIZE_PX = 84;
const WHEEL_RADIUS = WHEEL_SIZE_PX / 2;
const MIN_VALUE_PERCENT = 18;

export function WrapColorWheel({
  activeRgb,
  selectedWrapId,
  isCustomActive,
  onSelectWrap,
  onCustomColorChange,
}: WrapColorWheelProps) {
  const wheelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);

  const initialHsv = useMemo(
    () => rgbToHsv(activeRgb[0], activeRgb[1], activeRgb[2]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [hue, setHue] = useState<number>(initialHsv.h);
  const [sat, setSat] = useState<number>(initialHsv.s);
  const [val, setVal] = useState<number>(
    Math.max(MIN_VALUE_PERCENT / 100, initialHsv.v),
  );

  const activeHex = useMemo(
    () => rgbToHex(activeRgb[0], activeRgb[1], activeRgb[2]),
    [activeRgb],
  );

  const selectedWrap =
    WRAP_COLOURS.find((c) => c.id === selectedWrapId) ?? WRAP_COLOURS[0];

  // Keep wheel synchronized when user clicks a preset orb
  useEffect(() => {
    const currentFromState = hsvToRgb(hue, sat, val);
    const currentStateHex = rgbToHex(
      currentFromState[0],
      currentFromState[1],
      currentFromState[2],
    );
    if (currentStateHex !== activeHex) {
      const next = rgbToHsv(activeRgb[0], activeRgb[1], activeRgb[2]);
      if (next.s > 0.02) {
        setHue(next.h);
      }
      setSat(next.s);
      setVal(Math.max(MIN_VALUE_PERCENT / 100, next.v));
    }
  }, [activeHex, activeRgb, hue, sat, val]);

  // Render crisp high-DPI HSV color wheel onto canvas
  useEffect(() => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelSize = Math.round(WHEEL_SIZE_PX * dpr);
    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(pixelSize, pixelSize);
    const data = imageData.data;
    const center = pixelSize / 2;
    const radius = center - dpr;

    for (let y = 0; y < pixelSize; y += 1) {
      const dy = y + 0.5 - center;
      for (let x = 0; x < pixelSize; x += 1) {
        const dx = x + 0.5 - center;
        const dist = Math.hypot(dx, dy);
        const idx = (y * pixelSize + x) * 4;

        if (dist > radius + 1) {
          data[idx + 3] = 0;
          continue;
        }

        const { h, s } = wheelPointToHueSat(dx, dy, radius);
        const [r, g, b] = hsvToRgb(h, s, val);
        const edgeAlpha =
          dist > radius - 1
            ? Math.max(0, Math.min(1, radius + 1 - dist))
            : 1;

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = Math.round(edgeAlpha * 255);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [val]);

  const emitHsv = useCallback(
    (nextH: number, nextS: number, nextV: number) => {
      setHue(nextH);
      setSat(nextS);
      setVal(nextV);
      const [r, g, b] = hsvToRgb(nextH, nextS, nextV);
      onCustomColorChange(rgbToHex(r, g, b));
    },
    [onCustomColorChange],
  );

  const pickFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = wheelCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const radius = rect.width / 2;
      const dx = clientX - (rect.left + radius);
      const dy = clientY - (rect.top + radius);
      const { h, s } = wheelPointToHueSat(dx, dy, radius);
      emitHsv(h, s, val);
    },
    [emitHsv, val],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    isDraggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    pickFromClientPoint(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    pickFromClientPoint(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const stepHue = event.shiftKey ? 15 : 5;
    const stepSat = event.shiftKey ? 0.1 : 0.04;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      emitHsv((hue + stepHue) % 360, Math.max(0.15, sat), val);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      emitHsv((hue - stepHue + 360) % 360, Math.max(0.15, sat), val);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      emitHsv(hue, Math.min(1, sat + stepSat), val);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      emitHsv(hue, Math.max(0, sat - stepSat), val);
    }
  };

  const thumbPoint = hueSatToWheelPoint(hue, sat, WHEEL_RADIUS - 3);
  const fullBrightRgb = hsvToRgb(hue, sat, 1);
  const fullBrightHex = rgbToHex(
    fullBrightRgb[0],
    fullBrightRgb[1],
    fullBrightRgb[2],
  );
  const brightnessPercent = Math.round(val * 100);

  return (
    <div className="mt-4 flex items-center gap-3 sm:gap-4">
      {/* Interactive Circular HSV Color Wheel */}
      <div
        role="application"
        tabIndex={0}
        aria-label="Custom wrap color wheel"
        onKeyDown={handleWheelKeyDown}
        className="relative shrink-0 rounded-full p-[3px] border border-[#ECE8DF]/25 bg-[#060607]/85 shadow-[0_8px_22px_rgba(0,0,0,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ECE8DF]"
        style={{ width: WHEEL_SIZE_PX + 6, height: WHEEL_SIZE_PX + 6 }}
      >
        <canvas
          ref={wheelCanvasRef}
          data-testid="wrap-color-wheel"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="block rounded-full cursor-crosshair touch-none"
          style={{ width: WHEEL_SIZE_PX, height: WHEEL_SIZE_PX }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-[#ECE8DF] shadow-[0_0_0_1.5px_rgba(6,6,7,0.85)]"
          style={{
            left: `${thumbPoint.x + 3}px`,
            top: `${thumbPoint.y + 3}px`,
            backgroundColor: activeHex,
          }}
        />
      </div>

      {/* Minimal Right Stack: Active Name + 5 Swatch Orbs + Slim Brightness Bar */}
      <div className="min-w-0 flex-1 space-y-3">
        <div
          className="font-mono-atelier text-[11px] tracking-[0.06em] text-[#C9C5BC] truncate"
          aria-live="polite"
        >
          {isCustomActive ? `Custom · ${activeHex}` : selectedWrap.name}
        </div>

        <div
          role="group"
          aria-label="Signature wrap presets"
          className="flex flex-wrap items-center gap-2"
        >
          {WRAP_COLOURS.map((colour) => {
            const isSelected = !isCustomActive && colour.id === selectedWrapId;
            return (
              <button
                key={colour.id}
                type="button"
                title={colour.name}
                aria-label={colour.name}
                aria-pressed={isSelected}
                onClick={() => onSelectWrap(colour.id)}
                className={`w-7 h-7 rounded-full shrink-0 text-xs text-[#ECE8DF] bg-white/[0.05] transition-transform duration-150 cursor-pointer border border-[#ECE8DF]/25 ${isSelected
                    ? 'scale-110 ring-2 ring-[#ECE8DF]/65 ring-offset-2 ring-offset-[#0D0D10]'
                    : 'opacity-85 hover:opacity-100 hover:scale-105'
                  }`}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${colour.swatchHex} 0%, ${colour.swatchSecondaryHex} 100%)`,
                }}
              />
            );
          })}
        </div>

        <input
          id="wrap-brightness-slider"
          type="range"
          min={MIN_VALUE_PERCENT}
          max={100}
          step={1}
          value={brightnessPercent}
          onChange={(event) => {
            const nextV = Number(event.target.value) / 100;
            emitHsv(hue, sat, nextV);
          }}
          aria-label="Shade brightness"
          aria-valuetext={`${brightnessPercent} percent brightness`}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#ECE8DF] border border-[#ECE8DF]/20"
          style={{
            background: `linear-gradient(90deg, #141416 0%, ${fullBrightHex} 100%)`,
          }}
        />
      </div>
    </div>
  );
}
