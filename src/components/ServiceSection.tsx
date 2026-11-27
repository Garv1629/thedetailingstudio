import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  WRAP_COLOURS,
  type PackageId,
  type PpfFinishId,
  type ServiceStage,
  type WrapColourId,
} from '../data/atelierData';
import { clampPercent } from '../utils/bookingLogic';
import {
  CAR_WRAP_PAINT_PRESETS,
  parseHexColor,
} from '../utils/carWrapColorLogic';
import { RevealText } from './RevealText';
import { WrapColorWheel } from './WrapColorWheel';

interface ServiceSectionProps {
  stage: ServiceStage;
  correctionSplit: number;
  onCorrectionSplitChange: (value: number) => void;
  ceramicBonded: boolean;
  onCeramicBondedChange: (bonded: boolean) => void;
  ppfFinish: PpfFinishId;
  onPpfFinishChange: (finish: PpfFinishId) => void;
  selectedWrapId: WrapColourId;
  onSelectWrap: (colourId: WrapColourId) => void;
  customWrapHex?: string | null;
  onCustomWrapHexChange?: (hex: string) => void;
  onQuickBook: (
    packageId: PackageId,
    includeWrap?: boolean,
    categoryId?: ServiceStage['categoryId'],
    subService?: string,
  ) => void;
  floatingServiceSlot?: ReactNode;
}

export function ServiceSection({
  stage,
  correctionSplit,
  onCorrectionSplitChange,
  ceramicBonded,
  onCeramicBondedChange,
  ppfFinish,
  onPpfFinishChange,
  selectedWrapId,
  onSelectWrap,
  customWrapHex = null,
  onCustomWrapHexChange,
  onQuickBook,
  floatingServiceSlot,
}: ServiceSectionProps) {
  const isRight = stage.align === 'right';
  const selectedWrap =
    WRAP_COLOURS.find((c) => c.id === selectedWrapId) ?? WRAP_COLOURS[0];
  const activeWrapRgb: [number, number, number] =
    (customWrapHex ? parseHexColor(customWrapHex) : null) ??
    CAR_WRAP_PAINT_PRESETS[selectedWrapId].rgb;

  const mappedPackage: PackageId =
    stage.id === 'correction'
      ? 'gloss'
      : stage.id === 'ceramic'
        ? 'shield'
        : 'signature';

  const isColourStage = stage.id === 'colour';

  if (isColourStage) {
    return (
      <section
        id={stage.id}
        aria-labelledby={`heading-${stage.id}`}
        className="relative z-10 min-h-[100svh] flex items-end md:items-center py-20 px-5 sm:px-8 md:pr-16 lg:px-16 lg:pr-20"
      >
        <div className="mx-auto w-full max-w-[1320px]">
          <div className="w-full max-w-[360px] md:ml-auto">
            <div className="glass-surface-elevated rounded-2xl p-5 sm:p-6">
              <RevealText
                as="h2"
                id={`heading-${stage.id}`}
                text={stage.headline}
                className="font-editorial text-[clamp(1.75rem,2.6vw,2.25rem)] font-medium leading-[1.04] tracking-[-0.01em] text-[#ECE8DF]"
              />

              {onCustomWrapHexChange && (
                <WrapColorWheel
                  activeRgb={activeWrapRgb}
                  selectedWrapId={selectedWrapId}
                  isCustomActive={Boolean(customWrapHex)}
                  onSelectWrap={onSelectWrap}
                  onCustomColorChange={onCustomWrapHexChange}
                />
              )}

              <div className="mt-5 pt-4 border-t border-[#ECE8DF]/12 flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono-atelier text-[11px] text-[#A6A299]">
                    from
                  </span>
                  <span className="font-display-wide text-xl font-semibold text-[#ECE8DF] tabular-nums">
                    {stage.priceFrom}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onQuickBook(
                      mappedPackage,
                      true,
                      stage.categoryId,
                      stage.defaultSubService,
                    )
                  }
                  className="group inline-flex items-center gap-1.5 text-xs font-medium text-[#ECE8DF] hover:text-[#E6C692] py-2 px-2 transition-colors min-h-[40px] whitespace-nowrap cursor-pointer"
                >
                  <span>Reserve wrap</span>
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id={stage.id}
      aria-labelledby={`heading-${stage.id}`}
      className="relative z-10 min-h-[100svh] flex items-end md:items-center py-20 md:py-24 px-5 sm:px-8 md:pr-16 lg:px-16 lg:pr-20"
    >
      <div className="mx-auto w-full max-w-[1320px]">
        <div
          className={`flex flex-col gap-6 md:gap-10 ${
            floatingServiceSlot
              ? isRight
                ? 'md:flex-row md:items-start md:justify-between'
                : 'md:flex-row md:items-start md:justify-between'
              : ''
          }`}
        >
          {/* Opposite-side independent floating service card (left side when main panel is right) */}
          {floatingServiceSlot && isRight && (
            <div className="w-full md:w-auto md:pt-4 order-2 md:order-1">
              {floatingServiceSlot}
            </div>
          )}

          <div
            className={`w-full max-w-[490px] ${
              floatingServiceSlot
                ? isRight
                  ? 'order-1 md:order-2 md:ml-auto'
                  : 'order-1 md:mr-auto'
                : isRight
                  ? 'md:ml-auto'
                  : 'md:mr-auto'
            }`}
          >
            <div className="glass-surface-elevated rounded-2xl p-6 sm:p-8">
            {/* Editorial section index */}
            <p className="font-mono-atelier text-xs tracking-[0.14em] text-[#C9C5BC]">
              {stage.indexLabel}
            </p>

            {/* Expanded Display Headline */}
            <RevealText
              as="h2"
              id={`heading-${stage.id}`}
              text={stage.headline}
              className="mt-4 font-editorial text-[clamp(2.3rem,4vw,3.55rem)] font-normal leading-[1.02] tracking-[-0.015em] text-[#ECE8DF]"
            />

            {/* Description Prose */}
            <p className="mt-4 text-[15px] sm:text-base leading-[1.65] text-[#C9C5BC] max-w-[44ch]">
              {stage.description}
            </p>

            {/* Stage-Specific Interactive Craft Control */}
            {stage.id === 'correction' && (
              <div className="mt-6 pt-5 border-t border-[#ECE8DF]/15">
                <div className="flex items-center justify-between gap-4 text-xs font-mono-atelier">
                  <label
                    htmlFor="inspection-split-slider"
                    className="text-[#ECE8DF] font-medium"
                  >
                    Inspection light sweep
                  </label>
                  <span className="text-[#C9C5BC]">
                    {correctionSplit}% haze · {100 - correctionSplit}% mirror
                  </span>
                </div>
                <input
                  id="inspection-split-slider"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={correctionSplit}
                  onChange={(e) =>
                    onCorrectionSplitChange(clampPercent(Number(e.target.value)))
                  }
                  aria-valuetext={`${100 - correctionSplit} percent mirror corrected, ${correctionSplit} percent swirl haze`}
                  className="inspection-slider mt-3 w-full h-11"
                />
                <div className="flex items-center justify-between text-[11px] font-mono-atelier text-[#A6A299]">
                  <span>Mirror corrected</span>
                  <span>Uncorrected swirls</span>
                </div>
              </div>
            )}

            {stage.id === 'ceramic' && (
              <div className="mt-6 pt-5 border-t border-[#ECE8DF]/15">
                <span
                  id="ceramic-mode-label"
                  className="block font-mono-atelier text-xs text-[#C9C5BC] mb-3"
                >
                  Surface comparison
                </span>
                <div
                  role="group"
                  aria-labelledby="ceramic-mode-label"
                  className="glass-input inline-flex w-full sm:w-auto rounded-xl p-1"
                >
                  <button
                    type="button"
                    aria-pressed={ceramicBonded}
                    onClick={() => onCeramicBondedChange(true)}
                    className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-medium rounded-lg transition-colors min-h-[40px] whitespace-nowrap ${
                      ceramicBonded
                        ? 'bg-[#ECE8DF] text-[#060607]'
                        : 'text-[#D4D0C7] hover:text-[#ECE8DF]'
                    }`}
                  >
                    9H Ceramic bonded
                  </button>
                  <button
                    type="button"
                    aria-pressed={!ceramicBonded}
                    onClick={() => onCeramicBondedChange(false)}
                    className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-medium rounded-lg transition-colors min-h-[40px] whitespace-nowrap ${
                      !ceramicBonded
                        ? 'bg-[#ECE8DF] text-[#060607]'
                        : 'text-[#D4D0C7] hover:text-[#ECE8DF]'
                    }`}
                  >
                    Factory clearcoat
                  </button>
                </div>
              </div>
            )}

            {stage.id === 'film' && (
              <div className="mt-6 pt-5 border-t border-[#ECE8DF]/15">
                <span
                  id="ppf-finish-label"
                  className="block font-mono-atelier text-xs text-[#C9C5BC] mb-3"
                >
                  TPU film finish
                </span>
                <div
                  role="group"
                  aria-labelledby="ppf-finish-label"
                  className="glass-input inline-flex w-full sm:w-auto rounded-xl p-1"
                >
                  <button
                    type="button"
                    aria-pressed={ppfFinish === 'stealth'}
                    onClick={() => onPpfFinishChange('stealth')}
                    className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-medium rounded-lg transition-colors min-h-[40px] whitespace-nowrap ${
                      ppfFinish === 'stealth'
                        ? 'bg-[#ECE8DF] text-[#060607]'
                        : 'text-[#D4D0C7] hover:text-[#ECE8DF]'
                    }`}
                  >
                    Stealth satin
                  </button>
                  <button
                    type="button"
                    aria-pressed={ppfFinish === 'gloss'}
                    onClick={() => onPpfFinishChange('gloss')}
                    className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-medium rounded-lg transition-colors min-h-[40px] whitespace-nowrap ${
                      ppfFinish === 'gloss'
                        ? 'bg-[#ECE8DF] text-[#060607]'
                        : 'text-[#D4D0C7] hover:text-[#ECE8DF]'
                    }`}
                  >
                    Optical gloss
                  </button>
                </div>
              </div>
            )}

            {/* Quantitative Proof Metrics */}
            <ul className="mt-6 pt-5 border-t border-[#ECE8DF]/12 grid grid-cols-3 gap-4">
              {stage.stats.map((stat) => (
                <li key={stat.label} className="min-w-0">
                  <div className="font-display-wide text-lg sm:text-xl font-semibold text-[#ECE8DF] tabular-nums">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs leading-snug text-[#A6A299]">
                    {stat.label}
                  </div>
                </li>
              ))}
            </ul>

            {/* Price Anchor & Direct Action */}
            <div className="mt-6 pt-5 border-t border-[#ECE8DF]/12 flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="font-mono-atelier text-xs text-[#A6A299]">from</span>
                <span className="font-display-wide text-2xl sm:text-[28px] font-semibold text-[#ECE8DF] tabular-nums">
                  {stage.priceFrom}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  onQuickBook(
                    mappedPackage,
                    false,
                    stage.categoryId,
                    stage.defaultSubService,
                  )
                }
                className="group inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#ECE8DF] hover:text-white py-2.5 px-3 rounded-lg hover:bg-[#ECE8DF]/10 transition-colors min-h-[44px] whitespace-nowrap"
              >
                <span>Reserve {stage.category.toLowerCase()}</span>
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
            </div>
            </div>
          </div>

          {/* Opposite-side independent floating service card (right side when main panel is left) */}
          {floatingServiceSlot && !isRight && (
            <div className="w-full md:w-auto md:pt-4 order-2 md:ml-auto">
              {floatingServiceSlot}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
