import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import { EASE, VIEWPORT, fadeUp, stagger } from '../lib/motion.js';

// Full-viewport cinematic project slab. Backdrop is fully generated —
// accent radial glow + 64px grid + giant index watermark, no images.
export default function ProjectBlock({ index, slug, title, pitch, tags = [], side = 'left', accent }) {
  const isLeft = side === 'left';
  const num = String(index).padStart(2, '0');

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-60, 60]);

  return (
    <article ref={ref} className="relative flex min-h-[100dvh] w-full items-center overflow-hidden">
      {/* Backdrop — outer div carries parallax, inner carries the settle-in.
          Over-extended vertically so the ±60px drift never exposes an edge. */}
      <motion.div aria-hidden="true" style={{ y }} className="absolute inset-x-0 -inset-y-20">
        <motion.div
          initial={{ scale: 1.04, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 1.4, ease: EASE }}
          className="relative h-full w-full"
        >
          {/* Accent glow, biased toward the side opposite the copy */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 70% 55% at ${isLeft ? '72% 45%' : '28% 45%'}, ${accent}, transparent 70%)`,
            }}
          />
          {/* Faint 64px grid */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(rgba(167,139,250,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.08) 1px, transparent 1px)',
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
        </motion.div>
      </motion.div>

      {/* Directional scrim for copy legibility */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(${isLeft ? '90deg' : '270deg'}, rgba(5,3,15,0.88) 0%, rgba(5,3,15,0.5) 45%, rgba(5,3,15,0.02) 100%)`,
        }}
      />

      {/* Content column */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12, 0.15)}
          className={`flex max-w-xl flex-col gap-6 ${isLeft ? '' : 'md:ml-auto md:items-end md:text-right'}`}
        >
          <motion.span variants={fadeUp} className="eyebrow">
            project / {num}
          </motion.span>

          <motion.h3
            variants={fadeUp}
            className="text-[clamp(2rem,6vw,4.2rem)] font-bold leading-[1.05] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </motion.h3>

          <motion.p variants={fadeUp} className="max-w-md text-base text-[var(--color-fg-muted)] md:text-lg">
            {pitch}
          </motion.p>

          <motion.ul variants={fadeUp} className={`flex flex-wrap gap-2 ${isLeft ? '' : 'md:justify-end'}`}>
            {tags.map((tag) => (
              <li
                key={tag}
                className="glass rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)] transition-colors duration-300 hover:border-[var(--color-line-bright)] hover:text-[var(--color-violet-bright)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {tag}
              </li>
            ))}
          </motion.ul>

          <motion.div variants={fadeUp}>
            {slug ? (
              <Link
                to={`/projects/${slug}`}
                className="group relative inline-flex items-center gap-2 pb-1.5 text-xs uppercase tracking-[0.22em] text-[var(--color-fg)] transition-colors duration-300 hover:text-[var(--color-violet-bright)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                View deep-dive
                <FiArrowUpRight className="text-sm transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                {/* Underline-grow: faint base line + gradient line scaling in */}
                <span className="absolute bottom-0 left-0 h-px w-full bg-[var(--color-line)]" />
                <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-[linear-gradient(90deg,#a78bfa,#60a5fa)] transition-transform duration-500 ease-out group-hover:scale-x-100" />
              </Link>
            ) : (
              <span
                className="glass inline-flex cursor-default items-center rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-faint)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {'// awaiting content'}
              </span>
            )}
          </motion.div>
        </motion.div>
      </div>
    </article>
  );
}
