import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AtelierCredentialsSection } from './components/AtelierCredentialsSection';
import { BookingSection } from './components/BookingSection';
import { ChapterRail } from './components/ChapterRail';
import { ConciergeDock } from './components/ConciergeDock';
import { FaqSection } from './components/FaqSection';
import { InspectionModal } from './components/InspectionModal';
import { MagneticButton } from './components/MagneticButton';
import { MarqueeBand } from './components/MarqueeBand';
import { Navbar } from './components/Navbar';
import { PorscheCursor } from './components/PorscheCursor';
import { ScrollVideoSequence } from './components/ScrollVideoSequence';
import { ServiceScrollWaypoint } from './components/ServiceScrollWaypoint';
import { ServiceSection } from './components/ServiceSection';
import { StudioBackdrop } from './components/StudioBackdrop';
import { StudioFooter } from './components/StudioFooter';
import { StudioIntroCurtain } from './components/StudioIntroCurtain';
import {
  CHAPTERS,
  SERVICE_STAGES,
  type PackageId,
  type SectionId,
  type ServiceCategoryId,
  type WrapColourId,
} from './data/atelierData';
import {
  SERVICES_MENU_CATEGORIES,
  type ServiceMenuCategoryId,
} from './data/servicesMenuData';
import {
  computeActiveSection,
  type ConfirmedBooking,
} from './utils/bookingLogic';
import {
  createInitialServicesState,
  toggleServiceCategory,
  toggleServiceItem,
} from './utils/serviceAccordionLogic';
import {
  loadStudioBookings,
  loadStudioPreferences,
  mergeBookingsNonDestructively,
  saveStudioBooking,
  saveStudioPreferences,
} from './utils/studioStorage';

import type { VideoSequenceSegment } from './utils/scrollVideoLogic';

const CONTINUOUS_VIDEO_SEGMENTS: VideoSequenceSegment[] = [
  { basePath: '/assets/detailing/video-01/frames', frameCount: 120 },
  { basePath: '/assets/detailing/video-02/frames', frameCount: 120 },
];

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('top');

  // Independently positioned floating service glass cards state (all collapsed by default)
  const [servicesState, setServicesState] = useState(
    createInitialServicesState,
  );

  // Wrap colour showcase state (signature presets + bespoke custom colour wheel)
  const [selectedWrapId, setSelectedWrapId] =
    useState<WrapColourId>('racing-green');
  const [customWrapHex, setCustomWrapHex] = useState<string | null>(null);

  // Accessible inspection booking modal & confirmed bookings state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [modalPackageId, setModalPackageId] = useState<PackageId>('shield');
  const [modalMainServiceId, setModalMainServiceId] =
    useState<ServiceCategoryId>('ppf-protection');
  const [modalSubService, setModalSubService] =
    useState<string>('Full Body PPF');
  const [modalIncludeWrap, setModalIncludeWrap] = useState(false);
  const [recentBookings, setRecentBookings] = useState<ConfirmedBooking[]>([]);

  const rafPendingRef = useRef(false);
  const hasHydratedPrefsRef = useRef(false);

  // Non-destructive hydration of persisted bookings and wrap preferences from IndexedDB
  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadStudioBookings(), loadStudioPreferences()]).then(
      ([storedBookings, storedPrefs]) => {
        if (cancelled) return;
        if (storedBookings.length > 0) {
          setRecentBookings((prev) =>
            mergeBookingsNonDestructively(prev, storedBookings),
          );
        }
        if (storedPrefs) {
          setSelectedWrapId(storedPrefs.selectedWrapId);
          setCustomWrapHex(storedPrefs.customWrapHex);
        }
        hasHydratedPrefsRef.current = true;
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const washCleanCategory = SERVICES_MENU_CATEGORIES[0];
  const exteriorCategory = SERVICES_MENU_CATEGORIES[1];
  const interiorCategory = SERVICES_MENU_CATEGORIES[2];
  const polishingCategory = SERVICES_MENU_CATEGORIES[3];
  const protectionCategory = SERVICES_MENU_CATEGORIES[4];

  const colourStage = SERVICE_STAGES.find((stage) => stage.id === 'colour');

  const handleToggleFloatingCategory = useCallback(
    (categoryId: ServiceMenuCategoryId) => {
      setServicesState((prev) => toggleServiceCategory(prev, categoryId));
    },
    [],
  );

  const handleToggleFloatingService = useCallback((serviceId: string) => {
    setServicesState((prev) => toggleServiceItem(prev, serviceId));
  }, []);

  useEffect(() => {
    const updateScrollState = () => {
      rafPendingRef.current = false;
      const currentY = window.scrollY;
      const viewportH = window.innerHeight || 900;

      const sectionMetrics = CHAPTERS.map((chapter) => {
        const el = document.getElementById(chapter.id);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          id: chapter.id,
          top: rect.top + currentY,
          height: rect.height,
        };
      }).filter(
        (item): item is { id: SectionId; top: number; height: number } =>
          Boolean(item),
      );

      if (sectionMetrics.length > 0) {
        const nextActive = computeActiveSection(
          currentY,
          sectionMetrics,
          viewportH,
        );
        setActiveSection((prev) => (prev === nextActive ? prev : nextActive));
      }
    };

    const handleScroll = () => {
      if (rafPendingRef.current) return;
      rafPendingRef.current = true;
      window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleNavigate = useCallback((sectionId: SectionId) => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (sectionId === 'top') {
      window.scrollTo({
        top: 0,
        behavior: prefersReduced ? 'auto' : 'smooth',
      });
      return;
    }
    const target = document.getElementById(sectionId);
    if (!target) return;
    target.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  const handleSelectWrap = useCallback((nextWrapId: WrapColourId) => {
    setCustomWrapHex(null);
    setSelectedWrapId(nextWrapId);
    if (hasHydratedPrefsRef.current) {
      void saveStudioPreferences({
        selectedWrapId: nextWrapId,
        customWrapHex: null,
      });
    }
  }, []);

  const handleCustomWrapHexChange = useCallback(
    (nextHex: string) => {
      setCustomWrapHex(nextHex);
      if (hasHydratedPrefsRef.current) {
        void saveStudioPreferences({
          selectedWrapId,
          customWrapHex: nextHex,
        });
      }
    },
    [selectedWrapId],
  );

  const handleOpenBooking = useCallback(
    (
      packageId: PackageId = 'shield',
      includeWrap = false,
      categoryId: ServiceCategoryId = 'ppf-protection',
      subService = 'Full Body PPF',
    ) => {
      setModalPackageId(packageId);
      setModalIncludeWrap(includeWrap);
      setModalMainServiceId(categoryId);
      setModalSubService(subService);
      setBookingModalOpen(true);
    },
    [],
  );

  const handleBookingConfirmed = useCallback((booking: ConfirmedBooking) => {
    setRecentBookings((prev) => mergeBookingsNonDestructively([booking], prev));
    void saveStudioBooking(booking);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#060607] text-[#ECE8DF]">
      {/* Interactive Yellow Porsche Cursor across Desktop & Touch Devices */}
      <PorscheCursor />

      {/* Refined Studio Opening Curtain */}
      <StudioIntroCurtain />

      {/* Pure Obsidian Architectural Backdrop (zero static photos) */}
      <StudioBackdrop activeSection={activeSection} />

      {/* Accessible Three-Zone Floating Top Navigation */}
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenBooking={() => handleOpenBooking('shield', false)}
      />

      {/* Right-Side Chapter Navigation Rail */}
      <ChapterRail activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main Scroll Narrative */}
      <main id="main-content" className="relative z-10">
        {/* Single Continuous Scroll-Driven Video Stage (Video 1 -> Video 2, 240 seamless frames, no cuts) */}
        <ScrollVideoSequence
          sequenceId="continuous"
          segments={CONTINUOUS_VIDEO_SEGMENTS}
          eagerPreload
          activeWrapColourId={activeSection === 'colour' ? selectedWrapId : null}
          activeCustomWrapHex={activeSection === 'colour' ? customWrapHex : null}
          ariaLabel="Continuous automotive detailing scroll sequence from wash and interior care through paint correction, ceramic coating, and vinyl wrap"
        >
          {/* Hero Viewport — Asymmetric European Atelier Editorial Composition */}
          <section
            id="top"
            aria-labelledby="hero-heading"
            className="relative min-h-[100svh] flex flex-col justify-between pt-24 sm:pt-28 lg:pt-32 pb-20 sm:pb-24 lg:pb-16 px-5 sm:px-8 md:pr-16 lg:px-16 lg:pr-20"
          >
            {/* Upper-Left Swiss Atelier Masthead Eyebrow */}
            <div className="relative z-10 mx-auto w-full max-w-[1320px]">
              <div className="hero-editorial-enter inline-flex flex-col gap-1.5">
                <p className="font-sans-atelier text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ECE8DF]">
                  THE DETAILING STUDIO
                </p>
                <p className="font-sans-atelier text-[9.5px] sm:text-[10.5px] font-medium uppercase tracking-[0.26em] text-[#E6C692]">
                  GREATER NOIDA · AUTOMOTIVE ATELIER
                </p>
                <span
                  aria-hidden="true"
                  className="mt-1.5 block h-px w-12 bg-gradient-to-r from-[#E6C692]/80 to-transparent"
                />
              </div>
            </div>

            {/* Lower Editorial Asymmetric Split: Oversized Serif Statement (Left) + Quiet Copy & CTAs (Right) */}
            <div className="relative z-10 mx-auto w-full max-w-[1320px] mt-auto pt-6 sm:pt-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-10 items-end">
                {/* Monumental Two-Register Cormorant Garamond Headline */}
                <div className="hero-editorial-enter lg:col-span-7 xl:col-span-8">
                  <h1
                    id="hero-heading"
                    className="font-editorial text-[clamp(2.65rem,11vw,3.3rem)] sm:text-[clamp(3.6rem,7.8vw,5.4rem)] lg:text-[clamp(4.4rem,6.9vw,6.85rem)] leading-[0.88] drop-shadow-[0_14px_40px_rgba(0,0,0,0.9)]"
                  >
                    <span className="block hero-metallic-ink font-normal uppercase tracking-[0.045em] leading-[0.88]">
                      THE PURSUIT
                    </span>
                    <span className="block italic font-normal hero-champagne-italic text-[1.088em] tracking-[-0.015em] leading-[0.94] mt-0.5 sm:mt-0 md:pl-[0.65em] lg:pl-[0.95em] pr-2">
                      of perfection.
                    </span>
                  </h1>
                </div>

                {/* Right Editorial Column: Description + Hairline + Primary & Secondary CTAs */}
                <div className="hero-editorial-enter lg:col-span-5 xl:col-span-4 lg:pb-2.5 flex flex-col items-start gap-4 sm:gap-6">
                  <p className="font-sans-atelier text-[14px] sm:text-[15px] font-normal leading-[1.68] tracking-[0.02em] text-[#ECE8DF] max-w-[34ch] sm:max-w-[38ch] text-balance drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]">
                    Refined detailing. Flawless surfaces. Lasting protection.
                  </p>

                  <span
                    aria-hidden="true"
                    className="block h-px w-full max-w-[340px] bg-gradient-to-r from-[#E6C692]/50 via-[#ECE8DF]/20 to-transparent"
                  />

                  <div className="w-full sm:w-auto flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-start xl:items-center gap-3.5 sm:gap-6">
                    <MagneticButton
                      type="button"
                      maxOffsetPx={5}
                      onClick={() => handleOpenBooking('shield', false)}
                      className="luxury-directions-cta group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full px-6 py-3.5 font-sans-atelier text-xs font-semibold uppercase tracking-[0.2em] text-[#060607] min-h-[48px] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>BOOK AN INSPECTION</span>
                      <ArrowRight
                        className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </MagneticButton>

                    <button
                      type="button"
                      onClick={() => handleNavigate('wash-clean')}
                      className="hero-explore-link group self-start sm:self-auto inline-flex items-center justify-start gap-2.5 py-2 font-sans-atelier text-xs font-medium uppercase tracking-[0.22em] text-[#ECE8DF] hover:text-[#E6C692] transition-colors min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>EXPLORE OUR CRAFT</span>
                      <ArrowRight
                        className="w-3.5 h-3.5 text-[#E6C692] transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Position 01 — WASH & CLEAN (Left) */}
          <ServiceScrollWaypoint
            sectionId="wash-clean"
            category={washCleanCategory}
            align="left"
            minHeightClassName="min-h-[120svh]"
            isExpanded={servicesState.expandedCategoryId === washCleanCategory.id}
            selectedServiceId={
              servicesState.expandedCategoryId === washCleanCategory.id
                ? servicesState.selectedServiceId
                : null
            }
            onToggleCategory={() =>
              handleToggleFloatingCategory(washCleanCategory.id)
            }
            onToggleService={handleToggleFloatingService}
          />

          {/* Position 02 — EXTERIOR DETAILING (Right) */}
          <ServiceScrollWaypoint
            sectionId="exterior-detailing"
            category={exteriorCategory}
            align="right"
            minHeightClassName="min-h-[120svh]"
            isExpanded={servicesState.expandedCategoryId === exteriorCategory.id}
            selectedServiceId={
              servicesState.expandedCategoryId === exteriorCategory.id
                ? servicesState.selectedServiceId
                : null
            }
            onToggleCategory={() =>
              handleToggleFloatingCategory(exteriorCategory.id)
            }
            onToggleService={handleToggleFloatingService}
          />

          {/* Position 03 — INTERIOR DETAILING (Left) */}
          <ServiceScrollWaypoint
            sectionId="interior-detailing"
            category={interiorCategory}
            align="left"
            minHeightClassName="min-h-[115svh]"
            isExpanded={servicesState.expandedCategoryId === interiorCategory.id}
            selectedServiceId={
              servicesState.expandedCategoryId === interiorCategory.id
                ? servicesState.selectedServiceId
                : null
            }
            onToggleCategory={() =>
              handleToggleFloatingCategory(interiorCategory.id)
            }
            onToggleService={handleToggleFloatingService}
          />

          {/* Position 04 — POLISHING & PAINT CORRECTION (Right) */}
          <ServiceScrollWaypoint
            sectionId="correction"
            category={polishingCategory}
            align="right"
            minHeightClassName="min-h-[115svh]"
            isExpanded={servicesState.expandedCategoryId === polishingCategory.id}
            selectedServiceId={
              servicesState.expandedCategoryId === polishingCategory.id
                ? servicesState.selectedServiceId
                : null
            }
            onToggleCategory={() =>
              handleToggleFloatingCategory(polishingCategory.id)
            }
            onToggleService={handleToggleFloatingService}
          />

          {/* Position 05 — PAINT PROTECTION (Left) */}
          <ServiceScrollWaypoint
            sectionId="ceramic"
            category={protectionCategory}
            align="left"
            minHeightClassName="min-h-[125svh]"
            isExpanded={
              servicesState.expandedCategoryId === protectionCategory.id
            }
            selectedServiceId={
              servicesState.expandedCategoryId === protectionCategory.id
                ? servicesState.selectedServiceId
                : null
            }
            onToggleCategory={() =>
              handleToggleFloatingCategory(protectionCategory.id)
            }
            onToggleService={handleToggleFloatingService}
          />

          {/* Bespoke Colour Change Wrap Showcase (aligned with Video 2 vinyl wrap application) */}
          {colourStage && (
            <ServiceSection
              stage={colourStage}
              correctionSplit={38}
              onCorrectionSplitChange={() => {}}
              ceramicBonded={true}
              onCeramicBondedChange={() => {}}
              ppfFinish="stealth"
              onPpfFinishChange={() => {}}
              selectedWrapId={selectedWrapId}
              onSelectWrap={handleSelectWrap}
              customWrapHex={customWrapHex}
              onCustomWrapHexChange={handleCustomWrapHexChange}
              onQuickBook={handleOpenBooking}
            />
          )}
        </ScrollVideoSequence>

        {/* Scroll-Driven Architectural Kinetic Marquee Band */}
        <MarqueeBand />

        {/* Editorial Craft Proof & Dark Greater Noida Studio Location Card */}
        <AtelierCredentialsSection />

        {/* Packages, Live Booking Confirmation & Luxury Client Reviews Showcase */}
        <BookingSection
          onOpenBooking={(packageId) =>
            handleOpenBooking(packageId ?? 'shield', false)
          }
          recentBookings={recentBookings}
        />

        {/* Frequently Asked Questions Architectural Accordion */}
        <FaqSection onOpenBooking={() => handleOpenBooking('shield', false)} />
      </main>

      {/* Discreet Floating Smoked-Glass Direct Concierge */}
      <ConciergeDock
        onOpenBooking={() => handleOpenBooking('shield', false)}
      />

      {/* Quiet Luxury Architectural Footer Landmark */}
      <StudioFooter
        onNavigate={handleNavigate}
        onOpenBooking={() => handleOpenBooking('shield', false)}
      />

      {/* Accessible Inspection Booking Dialog */}
      <InspectionModal
        isOpen={bookingModalOpen}
        initialPackageId={modalPackageId}
        initialMainServiceId={modalMainServiceId}
        initialSubService={modalSubService}
        initialIncludeWrap={modalIncludeWrap}
        initialWrapColourId={selectedWrapId}
        onClose={() => setBookingModalOpen(false)}
        onBookingConfirmed={handleBookingConfirmed}
      />
    </div>
  );
}
