import { CHAPTERS, type SectionId } from '../data/atelierData';

interface ChapterRailProps {
  activeSection: SectionId;
  onNavigate: (sectionId: SectionId) => void;
}

export function ChapterRail({ activeSection, onNavigate }: ChapterRailProps) {
  return (
    /* Interactive right-side chapter progress rail */
    <nav
      aria-label="Section progress"
      className="hidden lg:flex fixed right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 flex-col items-end gap-2 pointer-events-none"
    >
      {CHAPTERS.map((chapter) => {
        const isActive = chapter.id === activeSection;
        return (
          <button
            key={chapter.id}
            type="button"
            onClick={() => onNavigate(chapter.id)}
            aria-label={`Jump to ${chapter.label}`}
            aria-current={isActive ? 'true' : undefined}
            className="group relative pointer-events-auto flex items-center justify-end py-1.5 pl-2 min-h-[28px] text-xs text-[#ECE8DF] cursor-pointer focus-visible:rounded-md"
          >
            <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 font-mono-atelier text-[10px] tracking-[0.12em] uppercase whitespace-nowrap rounded-full bg-[#060607]/88 border border-[#ECE8DF]/15 px-2.5 py-0.5 text-[#ECE8DF] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200">
              {chapter.label}
            </span>
            <span
              aria-hidden="true"
              className={`block h-[1.5px] transition-[width,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isActive
                  ? 'w-7 bg-[#ECE8DF]'
                  : 'w-3.5 bg-[#ECE8DF]/35 group-hover:w-5 group-hover:bg-[#ECE8DF]/75'
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
