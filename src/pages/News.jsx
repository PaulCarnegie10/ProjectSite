import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import Layout from '../components/Layout.jsx';
import Footer from '../sections/Footer.jsx';
import { NEWS } from '../data/news.js';
import { fadeUp, stagger, VIEWPORT } from '../lib/motion.js';

// 2026-06-01 → 2026.06.01
const fmtDate = (iso) => iso.replaceAll('-', '.');

// NEWS is newest-first, so grouping preserves order within each year.
const YEARS = NEWS.reduce((groups, entry) => {
  const year = entry.date.slice(0, 4);
  const last = groups[groups.length - 1];
  if (last && last.year === year) last.entries.push(entry);
  else groups.push({ year, entries: [entry] });
  return groups;
}, []);

// Glowing rail node: violet core + blurred halo; newest gets a pulse ring.
function TimelineNode({ pulse }) {
  return (
    <span aria-hidden="true" className="absolute left-0 top-1.5 flex h-[11px] w-[11px] items-center justify-center">
      <span className="absolute h-5 w-5 rounded-full bg-[var(--color-violet)] opacity-40 blur-[6px]" />
      {pulse && (
        <motion.span
          className="absolute h-[11px] w-[11px] rounded-full border border-[var(--color-violet-bright)]"
          animate={{ scale: [1, 2.6], opacity: [0.7, 0] }}
          transition={{ duration: 2.6, ease: 'easeOut', repeat: Infinity }}
        />
      )}
      <span className="relative h-[7px] w-[7px] rounded-full bg-[var(--color-violet-bright)] shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
    </span>
  );
}

function TimelineEntry({ entry, newest }) {
  return (
    <motion.li variants={fadeUp} className="group relative pb-12 pl-10 last:pb-0">
      <TimelineNode pulse={newest} />
      <div className="transition-transform duration-300 ease-out group-hover:translate-x-1">
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
        <h3 className="mt-2 text-base font-semibold transition-colors duration-300 group-hover:text-[var(--color-violet-bright)]">
          {entry.title}
        </h3>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[var(--color-fg-muted)]">{entry.body}</p>
        {entry.link && (
          <a
            href={entry.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--color-blue)] transition-colors hover:text-[var(--color-cyan)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {entry.link.label} <FiArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </motion.li>
  );
}

// Mono year label sitting on the rail: hollow ring node + tick + year.
function YearMarker({ year }) {
  return (
    <motion.div variants={fadeUp} className="relative mb-10 pl-10">
      <span aria-hidden="true" className="absolute left-[-1px] top-1/2 flex h-[13px] w-[13px] -translate-y-1/2 items-center justify-center">
        <span className="absolute h-6 w-6 rounded-full bg-[var(--color-blue)] opacity-25 blur-[8px]" />
        <span className="relative h-full w-full rounded-full border border-[var(--color-line-bright)] bg-[var(--color-bg-elevated)]" />
      </span>
      <span
        className="text-sm tracking-[0.3em] text-[var(--color-violet)]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {year}
      </span>
    </motion.div>
  );
}

export default function News() {
  useEffect(() => {
    document.title = 'News — Paul Colombo';
  }, []);

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-6 pt-36 md:pt-44">
        {/* Page header */}
        <motion.header initial="hidden" animate="visible" variants={stagger(0.12, 0.05)} className="mb-20">
          <motion.div variants={fadeUp} className="flex items-center gap-3">
            <span className="eyebrow">
              field notes <span className="text-[var(--color-fg-faint)]">//</span> archive
            </span>
            <span className="glow-line w-16" />
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="mt-5 text-[clamp(2.4rem,7vw,4.2rem)] font-bold leading-[1.05] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="text-aurora">News</span>.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 max-w-xl text-[var(--color-fg-muted)]">
            Every update so far — research, robotics, hackathons, and whatever else made the cut. Newest first.
          </motion.p>
        </motion.header>

        {/* Full timeline, one continuous rail with year markers */}
        <div className="relative pb-28 md:pb-36">
          <div
            aria-hidden="true"
            className="absolute bottom-32 left-[5px] top-1 w-px bg-[linear-gradient(to_bottom,transparent,rgba(167,139,250,0.5)_6%,rgba(96,165,250,0.5)_94%,transparent)]"
          />
          {YEARS.map(({ year, entries }, gi) => (
            <motion.div
              key={year}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              variants={stagger(0.14, 0.05)}
              className="pb-14 last:pb-0"
            >
              <YearMarker year={year} />
              <ol className="list-none">
                {entries.map((entry, i) => (
                  <TimelineEntry
                    key={`${entry.date}-${entry.title}`}
                    entry={entry}
                    newest={gi === 0 && i === 0}
                  />
                ))}
              </ol>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
