import { FiArrowDown, FiArrowUpRight } from 'react-icons/fi';
import MagneticLink from '../components/MagneticLink.jsx';
import site from '../content/site.json';

// One display line. Kept as its own component (and inside the same
// overflow clip) so the type metrics match what the animated version left
// behind — it just renders flat now.
function DisplayLine({ word, accent = false }) {
  return (
    <span aria-hidden="true" className="block overflow-hidden">
      <span className={`block whitespace-nowrap ${accent ? 'text-aurora' : ''}`}>{word}</span>
    </span>
  );
}

export default function Hero() {
  const scrollTo = (sel) => (e) => {
    e.preventDefault();
    document.querySelector(sel)?.scrollIntoView();
  };

  return (
    <section
      id="home"
      className="relative flex h-[100dvh] items-center justify-center overflow-hidden"
    >
      <div className="relative flex w-full flex-col items-center">
        {/* Orbit ring flourish — static, oversized, clipped by section overflow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 600 600"
            className="aspect-square w-[min(135vmin,70rem)] max-w-none shrink-0"
            aria-hidden="true"
          >
            <g transform="rotate(-16 300 300)">
              <ellipse
                cx="300"
                cy="300"
                rx="286"
                ry="104"
                fill="none"
                stroke="var(--color-line-bright)"
                strokeWidth="1"
              />
              {/* satellite resting on the ring */}
              <circle cx="586" cy="300" r="3" fill="var(--color-accent)" />
            </g>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <p className="eyebrow mb-7">{site.hero.eyebrow}</p>

          <h1
            aria-label="Paul Colombo"
            className="font-bold uppercase tracking-tight"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.6rem, 10vw, 8rem)',
              lineHeight: 1.04,
            }}
          >
            <DisplayLine word={site.hero.lines[0]} />
            <DisplayLine word={site.hero.lines[1]} accent />
          </h1>

          <p className="mt-7 max-w-md text-base text-[var(--color-fg-muted)] md:text-lg">
            {site.hero.tagline}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <MagneticLink variant="solid" href="#projects" onClick={scrollTo('#projects')}>
              {site.hero.ctaPrimary} <FiArrowDown aria-hidden="true" />
            </MagneticLink>
            <MagneticLink variant="ghost" href="#resume" onClick={scrollTo('#resume')}>
              {site.hero.ctaSecondary} <FiArrowUpRight aria-hidden="true" />
            </MagneticLink>
          </div>
        </div>
      </div>

      <div className="vignette" />

      {/* Scroll cue */}
      <div className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2">
        <div className="flex flex-col items-center gap-3">
          <span
            className="pl-[0.3em] text-[10px] uppercase tracking-[0.3em] text-[var(--color-fg-faint)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {site.hero.scrollCue}
          </span>
          <span className="relative block h-14 w-px overflow-hidden">
            <span className="absolute inset-0 bg-[var(--color-line-bright)]" />
          </span>
        </div>
      </div>
    </section>
  );
}
