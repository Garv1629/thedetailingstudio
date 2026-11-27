import { ArrowUpRight, MapPin, Phone } from 'lucide-react';
import { STUDIO_INFO, type SectionId } from '../data/atelierData';
import { buildGoogleMapsDirectionsUrl } from '../utils/luxuryMotionLogic';

interface StudioFooterProps {
  onNavigate: (sectionId: SectionId) => void;
  onOpenBooking: () => void;
}

const FOOTER_LINKS: Array<{ id: SectionId; label: string }> = [
  { id: 'wash-clean', label: 'Services' },
  { id: 'correction', label: 'Paint Correction' },
  { id: 'ceramic', label: 'Paint Protection' },
  { id: 'colour', label: 'Colour Wrap' },
  { id: 'studio', label: 'Zeta I Studio' },
  { id: 'faq', label: 'FAQ' },
];

export function StudioFooter({
  onNavigate,
  onOpenBooking,
}: StudioFooterProps) {
  const directionsUrl = buildGoogleMapsDirectionsUrl(
    `${STUDIO_INFO.brandName}, ${STUDIO_INFO.address}`,
  );

  return (
    <footer className="relative z-10 mt-4 sm:mt-8 px-4 sm:px-8 lg:px-16 pb-24 pt-12 sm:pt-16 overflow-hidden">
      {/* Subtle architectural top champagne catchlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(230, 198, 146, 0.36) 50%, transparent 95%)',
        }}
      />

      <div className="mx-auto w-full max-w-[1320px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 pb-10 sm:pb-12 border-b border-[#ECE8DF]/12">
          {/* Brand Signature Column */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-3">
            <p className="font-editorial text-xl sm:text-2xl font-medium tracking-[0.08em] text-[#ECE8DF]">
              {STUDIO_INFO.brandName}
            </p>
            <p className="font-mono-atelier text-xs text-[#E6C692]">
              {STUDIO_INFO.brandHindi}
            </p>
            <p className="pt-1 text-sm leading-[1.68] text-[#A6A299] max-w-[34ch]">
              Bespoke single-bay automotive restoration, multi-stage paint
              correction, 9H ceramic &amp; graphene coatings, self-healing TPU
              PPF, and reversible vinyl wraps in Greater Noida.
            </p>
          </div>

          {/* Navigation Column */}
          <div className="lg:col-span-2">
            <p className="font-mono-atelier text-[11px] tracking-[0.16em] text-[#E6C692] mb-4">
              Atelier
            </p>
            <ul className="space-y-2.5 text-sm text-[#C9C5BC]">
              {FOOTER_LINKS.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate(link.id);
                    }}
                    className="hover:text-[#ECE8DF] transition-colors whitespace-nowrap"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Location Column */}
          <div className="lg:col-span-3">
            <p className="font-mono-atelier text-[11px] tracking-[0.16em] text-[#E6C692] mb-4">
              Studio Bay
            </p>
            <div className="space-y-3 text-sm text-[#C9C5BC]">
              <p className="flex items-start gap-2 leading-relaxed">
                <MapPin
                  className="w-4 h-4 text-[#E6C692] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{STUDIO_INFO.address}</span>
              </p>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono-atelier text-xs text-[#ECE8DF] hover:text-[#E6C692] transition-colors"
              >
                <span>Open in Google Maps</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Direct Concierge Column */}
          <div className="lg:col-span-3">
            <p className="font-mono-atelier text-[11px] tracking-[0.16em] text-[#E6C692] mb-4">
              Concierge
            </p>
            <div className="space-y-3">
              <a
                href={STUDIO_INFO.phoneHref}
                className="inline-flex items-center gap-2 font-mono-atelier text-sm text-[#ECE8DF] hover:text-[#E6C692] transition-colors whitespace-nowrap"
              >
                <Phone
                  className="w-3.5 h-3.5 text-[#E6C692]"
                  aria-hidden="true"
                />
                <span>{STUDIO_INFO.phoneDisplay}</span>
              </a>
              <p className="font-mono-atelier text-xs text-[#A6A299] whitespace-nowrap">
                {STUDIO_INFO.hours}
              </p>
              <button
                type="button"
                onClick={onOpenBooking}
                className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[#ECE8DF]/25 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-[#ECE8DF] hover:bg-[#E6C692] hover:text-[#060607] transition-colors min-h-[40px] whitespace-nowrap cursor-pointer"
              >
                <span>Book inspection</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Quiet Bottom Copyright & Coordinates Bar */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono-atelier text-[11px] text-[#A6A299]">
          <span>
            © {new Date().getFullYear()} {STUDIO_INFO.brandName} ·{' '}
            {STUDIO_INFO.city}
          </span>
          <span>
            {STUDIO_INFO.plusCode} · {STUDIO_INFO.rating} ★ (
            {STUDIO_INFO.reviewCount} reviews)
          </span>
        </div>
      </div>
    </footer>
  );
}
