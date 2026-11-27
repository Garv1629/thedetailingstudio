import { useEffect, useRef, useState } from 'react';

interface RevealTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  immediate?: boolean;
  staggerMs?: number;
  id?: string;
}

export function RevealText({
  text,
  as: Tag = 'p',
  className = '',
  immediate = false,
  staggerMs = 26,
  id,
}: RevealTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(immediate);

  useEffect(() => {
    if (immediate) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate]);

  const words = text.split(' ');

  return (
    <Tag
      ref={ref as never}
      id={id}
      className={className}
    >
      {/* Screen readers receive continuous prose without word-by-word fragmentation */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline">
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="inline-block overflow-hidden align-top pb-[0.08em] -mb-[0.08em] mr-[0.26em] last:mr-0"
          >
            <span
              className="inline-block will-change-transform transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: visible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 108%, 0)',
                opacity: visible ? 1 : 0,
                transitionDelay: visible ? `${Math.min(index * staggerMs, 420)}ms` : '0ms',
              }}
            >
              {word}
            </span>
          </span>
        ))}
      </span>
    </Tag>
  );
}
