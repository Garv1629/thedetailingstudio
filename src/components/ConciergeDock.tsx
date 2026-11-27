import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  MessageCircle,
  Phone,
  X,
} from 'lucide-react';
import { STUDIO_INFO } from '../data/atelierData';
import { buildWhatsAppConciergeUrl } from '../utils/luxuryMotionLogic';

interface ConciergeDockProps {
  onOpenBooking: () => void;
}

export function ConciergeDock({ onOpenBooking }: ConciergeDockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement | null>(null);

  const whatsappUrl = buildWhatsAppConciergeUrl(
    STUDIO_INFO.phoneHref,
    'Hello The Detailing Studio Greater Noida, I would like to enquire about detailing / PPF for my car.',
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (dockRef.current && target && !dockRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={dockRef}
      data-testid="concierge-dock"
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-30 flex flex-col items-start gap-2.5"
    >
      {isOpen && (
        <div
          id="studio-concierge-menu"
          role="region"
          aria-label="Direct studio concierge"
          className="glass-surface-elevated w-[min(264px,calc(100vw-2rem))] rounded-2xl p-4 shadow-[0_24px_64px_rgba(0,0,0,0.68)]"
        >
          <div className="pb-3 border-b border-[#ECE8DF]/14">
            <p className="font-display-wide text-sm font-semibold text-[#ECE8DF]">
              Direct Concierge
            </p>
            <p className="mt-0.5 text-xs text-[#A6A299]">
              Zeta I, Greater Noida · {STUDIO_INFO.hours}
            </p>
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-[#ECE8DF] hover:bg-[#ECE8DF]/10 transition-colors min-h-[44px]"
            >
              <span className="flex items-center gap-2.5">
                <MessageCircle
                  className="w-4 h-4 text-[#ECE8DF]/85 shrink-0"
                  aria-hidden="true"
                />
                <span>WhatsApp Studio</span>
              </span>
              <ArrowUpRight
                className="w-3.5 h-3.5 text-[#A6A299] group-hover:text-[#ECE8DF] transition-colors"
                aria-hidden="true"
              />
            </a>

            <a
              href={STUDIO_INFO.phoneHref}
              onClick={() => setIsOpen(false)}
              className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-[#ECE8DF] hover:bg-[#ECE8DF]/10 transition-colors min-h-[44px]"
            >
              <span className="flex items-center gap-2.5">
                <Phone
                  className="w-4 h-4 text-[#ECE8DF]/85 shrink-0"
                  aria-hidden="true"
                />
                <span>Call {STUDIO_INFO.phoneDisplay}</span>
              </span>
              <ArrowUpRight
                className="w-3.5 h-3.5 text-[#A6A299] group-hover:text-[#ECE8DF] transition-colors"
                aria-hidden="true"
              />
            </a>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenBooking();
              }}
              className="luxury-directions-cta mt-1 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-[#060607] min-h-[44px] cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Book an inspection</span>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="studio-concierge-menu"
        aria-label={isOpen ? 'Close studio concierge' : 'Open studio concierge'}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 sm:gap-2.5 rounded-full border border-[#ECE8DF]/25 bg-white/[0.05] backdrop-blur-xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs font-medium text-[#ECE8DF] hover:border-[#ECE8DF]/45 transition-all duration-200 min-h-[40px] sm:min-h-[44px] cursor-pointer shadow-[0_14px_40px_rgba(0,0,0,0.48)]"
      >
        {isOpen ? (
          <X className="w-4 h-4 text-[#ECE8DF]" aria-hidden="true" />
        ) : (
          <MessageCircle
            className="w-4 h-4 text-[#ECE8DF]"
            aria-hidden="true"
          />
        )}
        <span className="whitespace-nowrap">Concierge</span>
      </button>
    </div>
  );
}
