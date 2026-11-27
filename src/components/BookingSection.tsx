import { ArrowRight, Check } from 'lucide-react';
import {
  PACKAGES,
  STUDIO_INFO,
  type PackageId,
} from '../data/atelierData';
import {
  formatCurrency,
  getCategoryTitle,
  type ConfirmedBooking,
} from '../utils/bookingLogic';
import { ClientReviewsShowcase } from './ClientReviewsShowcase';
import { MagneticButton } from './MagneticButton';
import { RevealText } from './RevealText';

interface BookingSectionProps {
  onOpenBooking: (packageId?: PackageId) => void;
  recentBookings: ConfirmedBooking[];
}

export function BookingSection({
  onOpenBooking,
  recentBookings,
}: BookingSectionProps) {
  return (
    <section
      id="book"
      aria-labelledby="heading-book"
      className="relative z-10 pt-24 sm:pt-32 pb-8 px-5 sm:px-8 md:pr-16 lg:px-16 lg:pr-20"
    >
      <div className="mx-auto w-full max-w-[1320px]">
        {/* Architectural Display Header */}
        <p className="font-mono-atelier text-[11px] tracking-[0.18em] text-[#E6C692]">
          Private studio consultation · Greater Noida
        </p>

        <RevealText
          as="h2"
          id="heading-book"
          text="Book an inspection."
          className="mt-3 font-editorial font-normal tracking-[-0.015em] leading-[0.94] text-[clamp(2.65rem,6.4vw,5.8rem)] text-[#ECE8DF] max-w-[11ch]"
        />

        {/* Intro Row + Sculpted Champagne-Ivory Primary Action */}
        <div className="mt-8 sm:mt-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <p className="text-base sm:text-[17px] leading-[1.68] text-[#C9C5BC] max-w-[46ch]">
            Visit our Zeta I, Greater Noida studio for a 30-minute paint depth
            audit. We inspect every panel under studio lighting and give you a
            clear, fixed INR estimate before any work begins.
          </p>

          <MagneticButton
            type="button"
            maxOffsetPx={5.5}
            onClick={() => onOpenBooking('shield')}
            className="luxury-directions-cta group inline-flex items-center justify-center gap-3 self-start md:self-auto rounded-full px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#060607] min-h-[50px] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Request a slot</span>
            <ArrowRight
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </MagneticButton>
        </div>


        {/* Live Session Confirmation Banner */}
        {recentBookings.length > 0 && (
          <div
            data-testid="confirmed-bookings-list"
            aria-live="polite"
            className="glass-surface-elevated mt-10 rounded-2xl p-5 sm:p-6 border border-[#E6C692]/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#ECE8DF]/14">
              <p className="font-mono-atelier text-xs tracking-[0.12em] text-[#E6C692]">
                Scheduled studio inspections ({recentBookings.length})
              </p>
              <span className="font-mono-atelier text-xs text-[#A6A299]">
                Zeta I, Greater Noida · {STUDIO_INFO.phoneDisplay}
              </span>
            </div>
            <ul className="mt-4 divide-y divide-[#ECE8DF]/12">
              {recentBookings.map((booking) => (
                <li
                  key={booking.reference}
                  className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-[#ECE8DF]">
                      {booking.values.vehicle} ·{' '}
                      <span className="text-[#C9C5BC]">
                        {booking.values.fullName}
                      </span>
                    </p>
                    <p className="font-mono-atelier text-xs text-[#A6A299]">
                      Ref {booking.reference} ·{' '}
                      {getCategoryTitle(booking.values.mainServiceId)} —{' '}
                      {booking.values.subService} · {booking.values.preferredDate}{' '}
                      at {booking.values.timeSlot}
                    </p>
                  </div>
                  <div className="font-display-wide text-base font-semibold text-[#ECE8DF] tabular-nums">
                    {formatCurrency(booking.estimate.totalPrice)}{' '}
                    <span className="font-mono-atelier text-xs font-normal text-[#A6A299]">
                      ({booking.estimate.estimatedDaysLabel})
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Three Curated Protection Tiers */}
        <div className="mt-14 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PACKAGES.map((pkg, idx) => {
            const isFlagship = pkg.id === 'signature';
            const tierIndex = `0${idx + 1}`;
            return (
              <article
                key={pkg.id}
                className={`relative group flex flex-col justify-between rounded-[24px] p-7 sm:p-8 hover:-translate-y-1.5 overflow-hidden ${
                  isFlagship
                    ? 'package-signature-card'
                    : 'glass-card-interactive'
                }`}
              >
                {/* Architectural Top Catchlight */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{
                    background: isFlagship
                      ? 'linear-gradient(90deg, transparent 8%, rgba(230, 198, 146, 0.8) 50%, transparent 92%)'
                      : 'linear-gradient(90deg, transparent 12%, rgba(236, 232, 223, 0.25) 50%, transparent 88%)',
                  }}
                />

                <div>
                  <div className="flex items-center justify-between gap-3 font-mono-atelier text-[11px] tracking-[0.14em]">
                    <span
                      className={
                        isFlagship ? 'text-[#E6C692]' : 'text-[#A6A299]'
                      }
                    >
                      {tierIndex} · {isFlagship ? 'Flagship protection' : 'Studio tier'}
                    </span>
                    <span className="text-[#A6A299] whitespace-nowrap tabular-nums">
                      {pkg.duration}
                    </span>
                  </div>

                  <h3 className="mt-3 font-editorial text-[28px] sm:text-[32px] font-medium uppercase tracking-[0.04em] leading-none text-[#ECE8DF]">
                    {pkg.name}
                  </h3>

                  <p className="mt-3 text-sm leading-[1.68] text-[#C9C5BC]">
                    {pkg.description}
                  </p>

                  <ul className="mt-6 space-y-3 border-t border-[#ECE8DF]/12 pt-6">
                    {pkg.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[13px] leading-snug text-[#C9C5BC]"
                      >
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isFlagship ? 'text-[#E6C692]' : 'text-[#ECE8DF]'
                          }`}
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-[#ECE8DF]/12 flex items-center justify-between gap-4">
                  <div>
                    <span className="block font-mono-atelier text-[10px] tracking-[0.12em] text-[#A6A299]">
                      Starting from
                    </span>
                    <span className="font-display-wide text-2xl sm:text-[28px] font-semibold text-[#ECE8DF] tabular-nums">
                      {pkg.priceFormatted}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenBooking(pkg.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold transition-all duration-200 min-h-[44px] whitespace-nowrap cursor-pointer ${
                      isFlagship
                        ? 'luxury-directions-cta text-[#060607]'
                        : 'border border-[#ECE8DF]/25 bg-white/[0.05] text-[#ECE8DF] hover:bg-[#ECE8DF] hover:text-[#060607]'
                    }`}
                  >
                    <span>Select {pkg.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Luxury Wet-Glass + Champagne-Gold Framed Client Reviews Showcase */}
        <ClientReviewsShowcase />
      </div>
    </section>
  );
}
