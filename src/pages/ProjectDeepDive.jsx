import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiGithub, FiMaximize2, FiX } from 'react-icons/fi';
import Layout from '../components/Layout.jsx';
import Footer from '../sections/Footer.jsx';
import MagneticLink from '../components/MagneticLink.jsx';
import { PROJECTS } from '../data/projects.js';

// Absolute URLs pass through; local paths (with or without a leading
// slash, the CMS stores '/projects/…') get the deploy base prefixed.
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

const captionClass = 'text-xs uppercase tracking-[0.14em] text-[var(--color-fg-faint)]';
const monoStyle = { fontFamily: 'var(--font-mono)' };

// Full-window overlay used when the Fullscreen API is unavailable or refused
// (embedded webviews, some mobile browsers). Escape or the button closes it.
function Lightbox({ src, poster, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Portal to <body> so the overlay sits above the fixed nav regardless of
  // the stacking context the clip lives in.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Video"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors duration-200 hover:border-white/50 hover:text-white"
      >
        <FiX className="h-5 w-5" />
      </button>
      <video
        controls
        autoPlay
        playsInline
        className="max-h-full max-w-full"
        src={src}
        poster={poster}
      />
    </div>,
    document.body,
  );
}

// One clip: the video, an explicit fullscreen button, and a caption.
// `portrait` lays it out in a narrow column (phone footage); otherwise it
// spans the article width.
function Clip({ video, portrait = false }) {
  const frameRef = useRef(null);
  const videoRef = useRef(null);
  const [lightbox, setLightbox] = useState(false);
  if (!video?.src) return null;

  const src = withBase(video.src);
  const poster = video.poster ? withBase(video.poster) : undefined;

  const goFullscreen = async () => {
    const frame = frameRef.current;
    const v = videoRef.current;
    try {
      if (frame?.requestFullscreen) {
        await frame.requestFullscreen();
        // Some embedded webviews resolve the request without ever showing
        // fullscreen; verify before trusting it.
        await new Promise((r) => setTimeout(r, 150));
        if (document.fullscreenElement === frame) return;
      }
      if (v?.webkitEnterFullscreen) {
        v.webkitEnterFullscreen();
        return;
      }
    } catch {
      // The API exists but the browser refused it; use the overlay instead.
    }
    setLightbox(true);
  };

  return (
    <figure
      className={`flex flex-col gap-3 ${portrait ? 'w-full max-w-[320px] md:w-[280px] md:shrink-0' : ''}`}
    >
      <div
        ref={frameRef}
        className="clip-frame overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-sunken)]"
      >
        <video
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          className="w-full"
          src={src}
          poster={poster}
        />
      </div>
      <div className="flex items-start justify-between gap-3">
        {video.caption ? (
          <figcaption className={captionClass} style={monoStyle}>
            {video.caption}
          </figcaption>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={goFullscreen}
          className="inline-flex shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)] transition-colors duration-200 hover:text-[var(--color-violet-bright)]"
          style={monoStyle}
        >
          <FiMaximize2 className="h-3.5 w-3.5" aria-hidden /> Fullscreen
        </button>
      </div>
      {lightbox && <Lightbox src={src} poster={poster} onClose={() => setLightbox(false)} />}
    </figure>
  );
}

// A body entry is either a paragraph string or a bullet list { label?, items[] }.
function BodyBlock({ entry }) {
  if (typeof entry === 'string') return <p>{entry}</p>;
  if (!entry || !Array.isArray(entry.items)) return null;
  return (
    <div className="flex flex-col gap-2">
      {entry.label && (
        <span className="text-xs uppercase tracking-[0.22em] text-[var(--color-fg-faint)]" style={monoStyle}>
          {entry.label}
        </span>
      )}
      <ul className="list-disc space-y-1 pl-5 text-base md:text-lg">
        {entry.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// Optional full-width image under a section's text (landscape renders, maps).
function SectionImage({ image }) {
  if (!image?.src) return null;
  return (
    <figure className="mt-10 flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-sunken)]">
        <img loading="lazy" className="w-full" src={withBase(image.src)} alt={image.caption ?? ''} />
      </div>
      {image.caption && (
        <figcaption className={captionClass} style={monoStyle}>
          {image.caption}
        </figcaption>
      )}
    </figure>
  );
}

function MediaGallery({ media = [] }) {
  if (media.length === 0) return null;
  return (
    <section className="py-12">
      <span className="glow-line mb-12 block" />
      <div className="flex flex-col gap-10">
        {media.map((m, i) =>
          m.type === 'video' ? (
            <Clip key={m.src ?? i} video={m} />
          ) : (
            <figure key={m.src ?? i} className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
                <img loading="lazy" className="w-full" src={withBase(m.src)} alt={m.caption ?? ''} />
              </div>
              {m.caption && (
                <figcaption className={captionClass} style={monoStyle}>
                  {m.caption}
                </figcaption>
              )}
            </figure>
          ),
        )}
      </div>
    </section>
  );
}

// Shared deep-dive template. Looks up its own data from PROJECTS via the
// :slug route param. Unknown slug redirects back to the index.
export default function ProjectDeepDive() {
  const { slug } = useParams();
  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) return <Navigate to="/projects" replace />;

  const { index, title, tagline, meta = {}, sections = [], media = [], links = [] } = project;
  // Sections with a clip get a wider column so text + portrait video fit side by side.
  const hasVideo = sections.some((s) => s.video?.src);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-36 md:pt-44">
        <div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--color-fg-muted)] transition-colors duration-200 hover:text-[var(--color-violet)]"
            style={monoStyle}
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
      <article className={`mx-auto ${hasVideo ? 'max-w-4xl' : 'max-w-3xl'} px-6 pb-28`}>
        {sections.map((s, i) => (
          <section key={s.heading ?? i} className="py-12 first:pt-0">
            {i > 0 && <span className="glow-line mb-12 block" />}
            <h2
              className="mb-5 text-xs uppercase tracking-[0.28em] text-[var(--color-violet)]"
              style={monoStyle}
            >
              {String(i + 1).padStart(2, '0')}{' '}
              <span className="text-[var(--color-fg-faint)]">/</span> {s.heading}
            </h2>
            <div className={s.video ? 'flex flex-col gap-8 md:flex-row md:items-start md:gap-12' : ''}>
              <div className="flex min-w-0 flex-1 flex-col gap-4 text-lg leading-relaxed text-[var(--color-fg-muted)]">
                {(s.body ?? []).map((entry, bi) => (
                  <BodyBlock key={bi} entry={entry} />
                ))}
              </div>
              <Clip video={s.video} portrait />
            </div>
            <SectionImage image={s.image} />
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
