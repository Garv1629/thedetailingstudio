import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { SectionId } from '../data/atelierData';
import { MagneticButton } from './MagneticButton';

interface NavbarProps {
  activeSection: SectionId;
  onNavigate: (sectionId: SectionId) => void;
  onOpenBooking: () => void;
}

const NAV_LINKS: Array<{ label: string; target: SectionId; activeMatches: SectionId[] }> = [
  {
    label: 'Services',
    target: 'wash-clean',
    activeMatches: ['wash-clean', 'interior-detailing', 'exterior-detailing'],
  },
  {
    label: 'Protection',
    target: 'correction',
    activeMatches: ['correction', 'ceramic'],
  },
  { label: 'Colour', target: 'colour', activeMatches: ['colour'] },
  { label: 'Studio', target: 'studio', activeMatches: ['studio'] },
  { label: 'Pricing', target: 'book', activeMatches: ['book'] },
];

export function Navbar({ activeSection, onNavigate, onOpenBooking }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, target: SectionId) => {
    event.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(target);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-30 pointer-events-none px-3 sm:px-4 pt-[max(0.625rem,env(safe-area-inset-top))] sm:pt-4">
      <a
        href="#main-content"
        className="pointer-events-auto sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-[#ECE8DF] focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-[#060607]"
      >
        Skip to main content
      </a>

      <div className="mx-auto max-w-4xl pointer-events-auto">
        <div className="glass-pill flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-8 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 md:pl-5 md:pr-2 lg:pl-6 lg:pr-2.5">
          {/* Zone 1: Single-element brand wordmark */}
          <a
            href="#top"
            onClick={(e) => handleLinkClick(e, 'top')}
            className="font-sans-atelier text-[10.5px] sm:text-[12px] lg:text-[12.5px] font-semibold tracking-[0.15em] sm:tracking-[0.2em] lg:tracking-[0.22em] text-[#ECE8DF] whitespace-nowrap shrink-0 py-1 sm:py-1.5"
            aria-label="The Detailing Studio Greater Noida — Back to top"
          >
            THE DETAILING STUDIO
          </a>

          {/* Zone 2: Clean single-line navigation links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-4 lg:gap-6 text-[12px] lg:text-[13px] font-medium"
          >
            {NAV_LINKS.map((item) => {
              const isActive = item.activeMatches.includes(activeSection);
              return (
                <a
                  key={item.label}
                  href={`#${item.target}`}
                  onClick={(e) => handleLinkClick(e, item.target)}
                  aria-current={isActive ? 'location' : undefined}
                  className={`relative whitespace-nowrap shrink-0 py-1.5 transition-colors duration-200 ${
                    isActive
                      ? 'text-[#ECE8DF]'
                      : 'text-[#C9C5BC] hover:text-[#ECE8DF]'
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 right-0 -bottom-0.5 h-px bg-[#ECE8DF] transition-transform duration-200 origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Single primary action + mobile menu button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <MagneticButton
              type="button"
              maxOffsetPx={4.5}
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              aria-label="Book an inspection"
              className="luxury-directions-cta inline-flex items-center justify-center rounded-full px-3 sm:px-3.5 lg:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-[#060607] whitespace-nowrap shrink-0 min-h-[38px] sm:min-h-[40px] cursor-pointer"
            >
              <span className="sm:hidden">Book</span>
              <span className="hidden sm:inline">Book an inspection</span>
            </MagneticButton>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-atelier-nav"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-[#ECE8DF]/25 bg-white/[0.05] text-xs text-[#ECE8DF] hover:bg-white/[0.12] transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Accessible mobile navigation panel */}
        {mobileMenuOpen && (
          <nav
            id="mobile-atelier-nav"
            aria-label="Mobile navigation"
            className="glass-surface-elevated md:hidden mt-2 rounded-2xl p-3"
          >
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((item) => {
                const isActive = item.activeMatches.includes(activeSection);
                return (
                  <li key={item.label}>
                    <a
                      href={`#${item.target}`}
                      onClick={(e) => handleLinkClick(e, item.target)}
                      aria-current={isActive ? 'location' : undefined}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] transition-colors ${
                        isActive
                          ? 'bg-[#ECE8DF]/12 text-[#ECE8DF]'
                          : 'text-[#C9C5BC] hover:bg-[#ECE8DF]/6 hover:text-[#ECE8DF]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="font-mono-atelier text-[11px] text-[#A6A299]">
                          Active
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
