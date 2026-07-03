import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import Layout from '../components/Layout.jsx';
import Footer from '../sections/Footer.jsx';
import { PROJECTS } from '../data/projects.js';
import { fadeUp, stagger, VIEWPORT } from '../lib/motion.js';

function ProjectCard({ project }) {
  const { index, slug, title, pitch, tags = [], meta = {} } = project;
  const num = String(index).padStart(2, '0');

  return (
    <motion.li variants={fadeUp} className="group relative">
      <Link
        to={`/projects/${slug}`}
        className="glass block rounded-2xl border border-[var(--color-line)] p-8 transition-colors duration-300 hover:border-[var(--color-line-bright)] md:p-10"
      >
        <div className="flex items-center gap-3">
          <span className="eyebrow">
            project / {num} <span className="text-[var(--color-fg-faint)]">//</span> {meta.status}
          </span>
        </div>

        <h2
          className="mt-5 text-[clamp(1.6rem,4vw,2.6rem)] font-bold leading-[1.1] tracking-tight transition-colors duration-300 group-hover:text-[var(--color-violet-bright)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h2>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-fg-muted)] md:text-lg">
          {pitch}
        </p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-[var(--color-line)] px-3.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {tag}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <div
            className="flex flex-wrap gap-x-5 gap-y-1 text-xs uppercase tracking-[0.14em] text-[var(--color-fg-faint)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {meta.timeframe && <span>{meta.timeframe}</span>}
            {meta.role && <span>{meta.role}</span>}
          </div>

          <span
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--color-fg)] transition-colors duration-300 group-hover:text-[var(--color-violet-bright)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            View deep-dive
            <FiArrowUpRight className="text-sm transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </motion.li>
  );
}

export default function ProjectsIndex() {
  useEffect(() => {
    document.title = 'Projects — Paul Colombo';
  }, []);

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-6 pt-36 md:pt-44">
        {/* Page header */}
        <motion.header initial="hidden" animate="visible" variants={stagger(0.12, 0.05)} className="mb-16">
          <motion.div variants={fadeUp} className="flex items-center gap-3">
            <span className="eyebrow">
              selected work <span className="text-[var(--color-fg-faint)]">//</span> archive
            </span>
            <span className="glow-line w-16" />
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="mt-5 text-[clamp(2.4rem,7vw,4.2rem)] font-bold leading-[1.05] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="text-aurora">Projects</span>.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 max-w-xl text-[var(--color-fg-muted)]">
            Everything I&rsquo;ve built and shipped, from research to weekend builds. Pick one to dive in.
          </motion.p>
        </motion.header>

        {/* Card list */}
        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.14, 0.05)}
          className="flex list-none flex-col gap-6 pb-28 md:pb-36"
        >
          {PROJECTS.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </motion.ol>
      </div>
      <Footer />
    </Layout>
  );
}
