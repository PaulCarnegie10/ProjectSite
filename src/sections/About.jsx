import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import SectionHeading from '../components/SectionHeading.jsx';
import { VIEWPORT, fadeUp, scaleIn, stagger } from '../lib/motion.js';

const CHIPS = ['CMU SCS', 'Class of 2028', 'Pittsburgh, PA'];

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
        eyebrow="About"
        title={
          <>
            The human in the <span className="text-aurora">loop</span>.
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
                fig. 01 — paul colombo / pittsburgh, pa
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
            Studying <span className="text-aurora">Computer Science</span> with an additional major
            in <span className="text-aurora">Robotics</span> at Carnegie Mellon University&apos;s
            School of Computer Science.
          </motion.p>

          {/* EDIT ME: placeholder bio — replace with your own two sentences */}
          <motion.p
            variants={fadeUp}
            className="max-w-xl text-base leading-relaxed text-[var(--color-fg-muted)]"
          >
            I spend most of my time on robot perception — teaching machines to make sense of what
            their cameras see. Lately that means building vision pipelines in PyTorch and making
            them fast enough for the real world.
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
