import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import SectionHeading from '../components/SectionHeading.jsx';
import { VIEWPORT, fadeUp, scaleIn, stagger } from '../lib/motion.js';
import site from '../content/site.json';

const CHIPS = site.about.chips;

// Position + border edges for the four sci-fi corner brackets.
const BRACKETS = [
  '-top-2.5 -left-2.5 border-t border-l',
  '-top-2.5 -right-2.5 border-t border-r',
  '-bottom-2.5 -left-2.5 border-b border-l',
  '-bottom-2.5 -right-2.5 border-b border-r',
];

export default function About() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], [36, -36]);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative mx-auto max-w-6xl px-6 py-28 md:py-36"
    >
      <SectionHeading
        index="01"
        eyebrow={site.about.eyebrow}
        title={
          <>
            {site.about.titlePre}
            <span className="text-aurora">{site.about.titleAccent}</span>
            {site.about.titlePost}
          </>
        }
      />

      <div className="grid items-start gap-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
        {/* ── Photo (parallax wrapper outside, reveal + tilt inside) ── */}
        <motion.div style={{ y: photoY }} className="mx-auto w-full max-w-sm md:mx-0">
          <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={scaleIn}>
            <motion.div
              whileHover={{ scale: 1.02, rotate: -0.8 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="relative"
            >
              {/* aurora glow halo */}
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-[2.5rem] blur-3xl"
                style={{
                  background:
                    'radial-gradient(60% 60% at 32% 28%, rgba(255,110,199,0.4), transparent 70%), radial-gradient(55% 55% at 72% 76%, rgba(108,196,255,0.35), transparent 70%)',
                }}
              />
              {/* corner brackets */}
              {BRACKETS.map((cls) => (
                <span
                  key={cls}
                  aria-hidden
                  className={`absolute h-5 w-5 ${cls}`}
                  style={{ borderColor: 'var(--color-line-bright)' }}
                />
              ))}
              <img
                src={`${import.meta.env.BASE_URL}Paul-Profile.jpg`}
                alt="Paul Colombo"
                className="aspect-[4/5] w-full rounded-2xl object-cover ring-1 ring-[var(--color-line)]"
              />
            </motion.div>

            {/* mono caption strip */}
            <div className="mt-5 flex items-center gap-3">
              <p
                className="text-[0.65rem] lowercase tracking-[0.18em] text-[var(--color-fg-faint)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {site.about.caption}
              </p>
              <span className="glow-line min-w-8 flex-1" />
            </div>
          </motion.div>
        </motion.div>

        {/* ── Text ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12, 0.1)}
          className="flex flex-col gap-6"
        >
          <motion.p
            variants={fadeUp}
            className="max-w-xl text-2xl font-light leading-snug text-[var(--color-fg)] md:text-3xl"
          >
            {site.about.paragraph1Pre}
            <span className="text-aurora">{site.about.paragraph1Accent1}</span>
            {site.about.paragraph1Mid}
            <span className="text-aurora">{site.about.paragraph1Accent2}</span>
            {site.about.paragraph1Post}
          </motion.p>

          {/* EDIT ME: placeholder bio — replace with your own two sentences */}
          <motion.p
            variants={fadeUp}
            className="max-w-xl text-base leading-relaxed text-[var(--color-fg-muted)]"
          >
            {site.about.paragraph2}
          </motion.p>

          {/* stat chips */}
          <motion.ul variants={stagger(0.1, 0.05)} className="mt-2 flex flex-wrap gap-3">
            {CHIPS.map((chip) => (
              <motion.li
                key={chip}
                variants={fadeUp}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="glass rounded-full px-5 py-2 text-xs tracking-[0.18em] text-[var(--color-fg-muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {chip}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  );
}
