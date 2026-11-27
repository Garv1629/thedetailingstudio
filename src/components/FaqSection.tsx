import { useState } from 'react';
import { ArrowRight, Phone, Plus } from 'lucide-react';
import { STUDIO_FAQS, STUDIO_INFO } from '../data/atelierData';
import { toggleFaqItem } from '../utils/editorialShowcaseLogic';
import { RevealText } from './RevealText';

interface FaqSectionProps {
  onOpenBooking: () => void;
}

export function FaqSection({ onOpenBooking }: FaqSectionProps) {
  const [openFaqId, setOpenFaqId] = useState<string | null>(
    STUDIO_FAQS[0]?.id ?? null,
  );

  return (
    <section
      id="faq"
      aria-labelledby="heading-faq"
      className="relative z-10 py-24 sm:py-32 px-5 sm:px-8 md:pr-16 lg:px-16 lg:pr-20 scroll-mt-4"
    >
      <div className="mx-auto w-full max-w-[1320px]">
        <div className="pt-14 border-t border-[#ECE8DF]/12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          {/* Left Sticky Editorial Intro Column */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <p className="font-mono-atelier text-[11px] tracking-[0.18em] text-[#E6C692]">
              Frequently asked questions
            </p>
            <RevealText
              as="h2"
              id="heading-faq"
              text="Questions, answered."
              className="mt-3 font-editorial font-normal tracking-[-0.015em] leading-[1.02] text-[clamp(2.3rem,4vw,3.5rem)] text-[#ECE8DF]"
            />
            <p className="mt-4 text-sm sm:text-[15px] leading-[1.7] text-[#C9C5BC] max-w-[34ch]">
              Clear guidance on paint correction, ceramic protection, wraps, and
              studio appointments in Greater Noida.
            </p>

            {/* Quiet Concierge Actions */}
            <div className="mt-8 pt-6 border-t border-[#ECE8DF]/12 space-y-3">
              <button
                type="button"
                onClick={onOpenBooking}
                className="group inline-flex items-center gap-2 text-xs font-semibold text-[#ECE8DF] hover:text-[#E6C692] transition-colors py-1.5 cursor-pointer"
              >
                <span className="text-[#E6C692]">Schedule a 30-minute paint audit</span>
                <ArrowRight
                  className="w-4 h-4 text-[#E6C692] transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>

              <div>
                <a
                  href={STUDIO_INFO.phoneHref}
                  className="inline-flex items-center gap-2 font-mono-atelier text-xs text-[#C9C5BC] hover:text-[#ECE8DF] transition-colors py-1"
                >
                  <Phone
                    className="w-3.5 h-3.5 text-[#E6C692]"
                    aria-hidden="true"
                  />
                  <span>Direct desk · {STUDIO_INFO.phoneDisplay}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Architectural Editorial Accordion (01 – 08) */}
          <div className="lg:col-span-8">
            <div className="glass-surface-elevated rounded-3xl overflow-hidden relative">
              {/* Top champagne architectural hairline */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 8%, rgba(230, 198, 146, 0.5) 50%, transparent 92%)',
                }}
              />

              <div className="divide-y divide-[#ECE8DF]/10">
                {STUDIO_FAQS.map((item) => {
                  const isOpen = openFaqId === item.id;
                  const panelId = `faq-panel-${item.id}`;
                  const buttonId = `faq-trigger-${item.id}`;

                  return (
                    <div
                      key={item.id}
                      className={`transition-colors duration-300 ${
                        isOpen ? 'bg-white/[0.03]' : 'bg-transparent'
                      }`}
                    >
                      <h3 className="m-0">
                        <button
                          id={buttonId}
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() =>
                            setOpenFaqId((prev) => toggleFaqItem(prev, item.id))
                          }
                          className="group w-full flex items-center justify-between gap-4 px-6 sm:px-8 py-5 sm:py-6 text-left text-xs text-[#ECE8DF] cursor-pointer focus-visible:outline-none focus-visible:bg-white/[0.05]"
                        >
                          <span className="flex items-baseline gap-4 min-w-0">
                            <span
                              className={`font-mono-atelier text-xs tabular-nums shrink-0 transition-colors duration-200 ${
                                isOpen
                                  ? 'text-[#E6C692]'
                                  : 'text-[#A6A299] group-hover:text-[#E6C692]'
                              }`}
                            >
                              {item.number}.
                            </span>
                            <span
                              className={`font-display-wide text-[15px] sm:text-[17px] font-semibold leading-snug transition-colors duration-200 ${
                                isOpen
                                  ? 'text-[#ECE8DF]'
                                  : 'text-[#C9C5BC] group-hover:text-[#ECE8DF]'
                              }`}
                            >
                              {item.question}
                            </span>
                          </span>

                          <span
                            aria-hidden="true"
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full border shrink-0 transition-all duration-300 ${
                              isOpen
                                ? 'border-[#E6C692]/55 bg-[#E6C692]/12 text-[#E6C692] rotate-45'
                                : 'border-[#ECE8DF]/16 text-[#A6A299] group-hover:border-[#ECE8DF]/35 group-hover:text-[#ECE8DF]'
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                          </span>
                        </button>
                      </h3>

                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isOpen
                            ? 'grid-rows-[1fr] opacity-100'
                            : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="px-6 sm:px-8 pb-6 sm:pb-7 pl-[52px] sm:pl-[68px] text-sm sm:text-[15px] leading-[1.72] text-[#C9C5BC] max-w-[64ch]">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
