import { Link, Navigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiGithub } from 'react-icons/fi';
import Layout from '../components/Layout.jsx';
import Footer from '../sections/Footer.jsx';
import MagneticLink from '../components/MagneticLink.jsx';
import { PROJECTS } from '../data/projects.js';

// Absolute URLs pass through; local paths (with or without a leading
// slash — the CMS stores '/projects/…') get the deploy base prefixed.
const withBase = (path) =>
  /^(https?:)?\/\//.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

// Title with the accent colour applied to the last word (string titles only).
function AccentTitle({ title }) {
  if (typeof title !== 'string') return title;
  const words = title.trim().split(' ');
  const last = words.pop();
  return (
    <>
      {words.length > 0 && words.join(' ') + ' '}
      <span className="text-aurora">{last}</span>
    </>
  );
}

// Small mono chip used for the timeframe / role / status meta row.
function MetaChip({ label }) {
  if (!label) return null;
  return (
    <span
      className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {label}
    </span>
  );
}

function MediaGallery({ media = [] }) {
  if (media.length === 0) return null;
  return (
    <section className="py-12">
      <span className="glow-line mb-12 block" />
      <div className="flex flex-col gap-10">
        {media.map((m, i) => (
          <figure key={m.src ?? i} className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
              {m.type === 'video' ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full"
                  src={withBase(m.src)}
                />
              ) : (
                <img
                  loading="lazy"
                  className="w-full"
                  src={withBase(m.src)}
                  alt={m.caption ?? ''}
                />
              )}
            </div>
            {m.caption && (
              <figcaption
                className="text-xs uppercase tracking-[0.14em] text-[var(--color-fg-faint)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {m.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

// Shared deep-dive template — looks up its own data from PROJECTS via the
// :slug route param. Unknown slug redirects back to the index.
export default function ProjectDeepDive() {
  const { slug } = useParams();
  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) return <Navigate to="/projects" replace />;

  const { index, title, tagline, meta = {}, sections = [], media = [], links = [] } = project;

  return (
    <Layout>
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-36 md:pt-44">
        <div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--color-fg-muted)] transition-colors duration-200 hover:text-[var(--color-violet)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <FiArrowLeft /> All projects
          </Link>

          <div className="mt-12 flex items-center gap-3">
            <span className="eyebrow">project / {String(index).padStart(2, '0')}</span>
            <span className="glow-line w-16" />
          </div>

          <h1
            className="mt-5 max-w-4xl text-[clamp(2.4rem,7vw,5.5rem)] font-bold leading-[1.05] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <AccentTitle title={title} />
          </h1>

          {tagline && (
            <p className="mt-7 max-w-2xl text-xl leading-relaxed text-[var(--color-fg-muted)]">
              {tagline}
            </p>
          )}

          {(meta.timeframe || meta.role || meta.status) && (
            <div className="mt-7 flex flex-wrap gap-2.5">
              <MetaChip label={meta.timeframe} />
              <MetaChip label={meta.role} />
              <MetaChip label={meta.status} />
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <article className="mx-auto max-w-3xl px-6 pb-28">
        {sections.map((s, i) => (
          <section key={s.heading ?? i} className="py-12 first:pt-0">
            {i > 0 && <span className="glow-line mb-12 block" />}
            <h2
              className="mb-5 text-xs uppercase tracking-[0.28em] text-[var(--color-violet)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {String(i + 1).padStart(2, '0')}{' '}
              <span className="text-[var(--color-fg-faint)]">/</span> {s.heading}
            </h2>
            <div className="flex flex-col gap-4 text-lg leading-relaxed text-[var(--color-fg-muted)]">
              {(s.body ?? []).map((paragraph, pi) => (
                <p key={pi}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}

        <MediaGallery media={media} />

        {/* Bottom CTA */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <MagneticLink to="/projects" variant="ghost">
            <FiArrowLeft /> Back to all projects
          </MagneticLink>
          {links.map((l) => (
            <MagneticLink
              key={l.href}
              href={withBase(l.href)}
              target="_blank"
              rel="noreferrer"
              variant="ghost"
            >
              {l.label}
            </MagneticLink>
          ))}
          <MagneticLink href="https://github.com/PaulCarnegie10" variant="solid">
            <FiGithub /> GitHub
          </MagneticLink>
        </div>
      </article>

      <Footer />
    </Layout>
  );
}
