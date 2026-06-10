import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import { NEWS } from '../data/news.js';
import SectionHeading from '../components/SectionHeading.jsx';
import MagneticLink from '../components/MagneticLink.jsx';
import { fadeUp, stagger, VIEWPORT } from '../lib/motion.js';

// 2026-06-01 → 2026.06.01
const fmtDate = (iso) => iso.replaceAll('-', '.');

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

export default function NewsTeaser() {
  return (
    <section id="news" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <SectionHeading
        index="04"
        eyebrow="Field Notes"
        title={<>What I'm <span className="text-aurora">up to</span>.</>}
      />

      <motion.ol
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={stagger(0.16, 0.1)}
        className="relative list-none"
      >
        {/* vertical gradient rail, centered under the 11px nodes */}
        <div
          aria-hidden="true"
          className="absolute bottom-3 left-[5px] top-3 w-px bg-[linear-gradient(to_bottom,transparent,rgba(167,139,250,0.5)_12%,rgba(96,165,250,0.5)_88%,transparent)]"
        />
        {NEWS.slice(0, 3).map((entry, i) => (
          <TimelineEntry key={`${entry.date}-${entry.title}`} entry={entry} newest={i === 0} />
        ))}
      </motion.ol>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={fadeUp}
        className="mt-12 pl-10"
      >
        <MagneticLink to="/news" variant="ghost">
          All updates <FiArrowUpRight className="h-4 w-4" />
        </MagneticLink>
      </motion.div>
    </section>
  );
}
