import { FiArrowUpRight } from 'react-icons/fi';
import { NEWS } from '../data/news.js';
import SectionHeading from '../components/SectionHeading.jsx';
import MagneticLink from '../components/MagneticLink.jsx';
import site from '../content/site.json';

// 2026-06-01 → 2026.06.01
const fmtDate = (iso) => iso.replaceAll('-', '.');

// Rail node. Same 11px footprint as before so it stays centred on the rail;
// the halo and pulse ring are gone.
function TimelineNode({ newest }) {
  return (
    <span
      aria-hidden="true"
      className="absolute left-0 top-1.5 flex h-[11px] w-[11px] items-center justify-center"
    >
      <span
        className={`relative h-[7px] w-[7px] rounded-full ${
          newest ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-fg-faint)]'
        }`}
      />
    </span>
  );
}

function TimelineEntry({ entry, newest }) {
  return (
    <li className="group relative pb-12 pl-10 last:pb-0">
      <TimelineNode newest={newest} />
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="text-xs tracking-[0.18em] text-[var(--color-fg-muted)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {fmtDate(entry.date)}
          </span>
          <span
            className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-violet)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {entry.tag}
          </span>
        </div>
        <h3 className="mt-2 text-base font-semibold transition-colors duration-200 group-hover:text-[var(--color-violet-bright)]">
          {entry.title}
        </h3>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[var(--color-fg-muted)]">
          {entry.body}
        </p>
        {entry.link && (
          <a
            href={entry.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--color-blue)] transition-colors duration-200 hover:text-[var(--color-cyan)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {entry.link.label} <FiArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </li>
  );
}

export default function NewsTeaser() {
  return (
    <section id="news" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <SectionHeading
        index="04"
        eyebrow={site.sections.news.eyebrow}
        title={
          <>
            {site.sections.news.titlePre}
            <span className="text-aurora">{site.sections.news.titleAccent}</span>
            {site.sections.news.titlePost}
          </>
        }
      />

      <ol className="relative list-none">
        {/* vertical rail, centered under the 11px nodes */}
        <div
          aria-hidden="true"
          className="absolute bottom-3 left-[5px] top-3 w-px bg-[var(--color-line)]"
        />
        {NEWS.slice(0, 3).map((entry, i) => (
          <TimelineEntry key={`${entry.date}-${entry.title}`} entry={entry} newest={i === 0} />
        ))}
      </ol>

      <div className="mt-12 pl-10">
        <MagneticLink to="/news" variant="ghost">
          {site.sections.news.allLink} <FiArrowUpRight className="h-4 w-4" />
        </MagneticLink>
      </div>
    </section>
  );
}
