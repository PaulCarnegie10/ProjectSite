import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiGithub } from 'react-icons/fi';
import Layout from '../components/Layout.jsx';
import Footer from '../sections/Footer.jsx';
import MagneticLink from '../components/MagneticLink.jsx';
import { VIEWPORT, fadeUp, stagger } from '../lib/motion.js';

// Title with .text-aurora applied to the last word (string titles only).
function AuroraTitle({ title }) {
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

// Shared deep-dive template. Props API is fixed — TerrainMapper.jsx and
// DrWuCrew.jsx pass { slot, title, tagline, sections: [{ heading, body }] }.
export default function ProjectDeepDive({ slot, title, tagline, sections = [] }) {
  return (
    <Layout>
      {/* Hero — above the fold, so animate (not whileInView) */}
      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-36 md:pt-44">
        <motion.div initial="hidden" animate="visible" variants={stagger(0.12, 0.05)}>
          <motion.div variants={fadeUp}>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--color-fg-muted)] transition-colors duration-300 hover:text-[var(--color-violet)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <FiArrowLeft /> Back
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-12 flex items-center gap-3">
            <span className="eyebrow">project / {slot}</span>
            <span className="glow-line w-16" />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-5 max-w-4xl text-[clamp(2.4rem,7vw,5.5rem)] font-bold leading-[1.05] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <AuroraTitle title={title} />
          </motion.h1>

          {tagline && (
            <motion.p
              variants={fadeUp}
              className="mt-7 max-w-2xl text-xl leading-relaxed text-[var(--color-fg-muted)]"
            >
              {tagline}
            </motion.p>
          )}
        </motion.div>
      </section>

      {/* Body */}
      <article className="mx-auto max-w-3xl px-6 pb-28">
        {sections.map((s, i) => (
          <motion.section
            key={s.heading ?? i}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={fadeUp}
            className="py-12 first:pt-0"
          >
            {i > 0 && <span className="glow-line mb-12 block" />}
            <h2
              className="mb-5 text-xs uppercase tracking-[0.28em] text-[var(--color-violet)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {String(i + 1).padStart(2, '0')}{' '}
              <span className="text-[var(--color-fg-faint)]">/</span> {s.heading}
            </h2>
            <div className="text-lg leading-relaxed text-[var(--color-fg-muted)]">{s.body}</div>
          </motion.section>
        ))}

        {/* Bottom CTA */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={fadeUp}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <MagneticLink to="/" variant="ghost">
            <FiArrowLeft /> Back to all projects
          </MagneticLink>
          <MagneticLink href="https://github.com/PaulCarnegie10" variant="solid">
            <FiGithub /> GitHub
          </MagneticLink>
        </motion.div>
      </article>

      <Footer />
    </Layout>
  );
}
