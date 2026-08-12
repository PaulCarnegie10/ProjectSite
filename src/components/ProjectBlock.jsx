import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';

// Absolute URLs pass through; local paths (with or without a leading
// slash — the CMS stores '/projects/…') get the deploy base prefixed.
const withBase = (path) =>
  /^(https?:)?\/\//.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

// Full-viewport project slab. Backdrop is generated — a flat accent tint,
// a 64px grid and a giant index watermark. An optional `cover` image sits
// on the tint side; without one the slab stays purely typographic.
export default function ProjectBlock({
  index,
  slug,
  title,
  pitch,
  tags = [],
  side = 'left',
  accent,
  cover,
}) {
  const isLeft = side === 'left';
  const num = String(index).padStart(2, '0');

  const coverFrame = cover && (
    <div className={cover && !isLeft ? 'md:order-1' : ''}>
      <Wrapper slug={slug}>
        <img
          src={withBase(cover)}
          alt={title}
          loading="lazy"
          className="w-full rounded-2xl border border-[var(--color-line)]"
        />
      </Wrapper>
    </div>
  );

  return (
    <article className="relative flex min-h-[100dvh] w-full items-center overflow-hidden">
      {/* Backdrop */}
      <div aria-hidden="true" className="absolute inset-0">
        {/* Flat accent tint — no wash, no glow */}
        <div className="absolute inset-0" style={{ background: accent }} />
        {/* Faint 64px grid */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(233,229,223,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(233,229,223,0.05) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        {/* Giant index watermark */}
        <div
          className={`absolute bottom-[10%] select-none leading-none ${isLeft ? 'right-[2%]' : 'left-[2%]'}`}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 'clamp(11rem, 32vw, 26rem)',
            color: 'var(--color-fg)',
            opacity: 0.03,
          }}
        >
          {num}
        </div>
      </div>

      {/* Content column */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24">
        <div className={cover ? 'grid items-center gap-12 md:grid-cols-2 md:gap-16' : ''}>
          <div
            className={`flex max-w-xl flex-col gap-6 ${isLeft ? '' : 'md:ml-auto md:items-end md:text-right'} ${cover && !isLeft ? 'md:order-2' : ''}`}
          >
            <span className="eyebrow">project / {num}</span>

            <h3
              className="text-[clamp(2rem,6vw,4.2rem)] font-bold leading-[1.05] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title}
            </h3>

            <p className="max-w-md text-base text-[var(--color-fg-muted)] md:text-lg">{pitch}</p>

            <ul className={`flex flex-wrap gap-2 ${isLeft ? '' : 'md:justify-end'}`}>
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="glass rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)] transition-colors duration-200 hover:border-[var(--color-line-bright)] hover:text-[var(--color-violet-bright)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {tag}
                </li>
              ))}
            </ul>

            <div>
              {slug ? (
                <Link
                  to={`/projects/${slug}`}
                  className="group relative inline-flex items-center gap-2 pb-1.5 text-xs uppercase tracking-[0.22em] text-[var(--color-fg)] transition-colors duration-200 hover:text-[var(--color-violet-bright)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  View deep-dive
                  <FiArrowUpRight className="text-sm" />
                  {/* Underline: hairline base + accent line fading in on hover */}
                  <span className="absolute bottom-0 left-0 h-px w-full bg-[var(--color-line)]" />
                  <span className="absolute bottom-0 left-0 h-px w-full bg-[var(--color-accent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </Link>
              ) : (
                <span
                  className="glass inline-flex cursor-default items-center rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-faint)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {'// awaiting content'}
                </span>
              )}
            </div>
          </div>

          {coverFrame}
        </div>
      </div>
    </article>
  );
}

// Cover links through to the deep-dive when one exists.
function Wrapper({ slug, children }) {
  if (!slug) return children;
  return (
    <Link to={`/projects/${slug}`} aria-label="View deep-dive">
      {children}
    </Link>
  );
}
