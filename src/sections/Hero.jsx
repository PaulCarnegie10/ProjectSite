import { motion, useScroll, useTransform } from 'framer-motion';
import { FiArrowDown, FiArrowUpRight } from 'react-icons/fi';
import MagneticLink from '../components/MagneticLink.jsx';
import { EASE, fadeUp, fadeIn, stagger } from '../lib/motion.js';

// Same hues as .text-aurora — repeated here so the gradient can be sliced
// per-letter via background-position while reading as one continuous sweep.
const AURORA =
  'linear-gradient(100deg, #ff9ad8 0%, #ff6ec7 30%, #b78cff 70%, #6cc4ff 100%)';

const letterRise = {
  hidden: { y: '115%' },
  visible: { y: '0%', transition: { duration: 0.9, ease: EASE } },
};

// One display line revealed letter-by-letter inside an overflow clip.
// `aurora` slides a word-wide gradient across the letters so the gradient
// stays continuous even though each letter animates independently.
function DisplayLine({ word, aurora = false }) {
  const n = word.length;
  return (
    <span aria-hidden="true" className="block overflow-hidden">
      <motion.span variants={stagger(0.045, 0)} className="block whitespace-nowrap">
        {word.split('').map((ch, i) => (
          <motion.span
            key={i}
            variants={letterRise}
            className="inline-block"
            style={
              aurora
                ? {
                    backgroundImage: AURORA,
                    backgroundSize: `${n * 100}% 100%`,
                    backgroundPosition: `${(i / (n - 1)) * 100}% 0%`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }
                : undefined
            }
          >
            {ch}
          </motion.span>
        ))}
      </motion.span>
    </span>
  );
}

export default function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, -120]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  const scrollTo = (sel) => (e) => {
    e.preventDefault();
    document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      className="relative flex h-[100dvh] items-center justify-center overflow-hidden"
    >
      <style>{`
        @keyframes hero-orbit { to { transform: rotate(360deg); } }
        @keyframes hero-cue {
          0% { transform: translateY(-100%); }
          65%, 100% { transform: translateY(100%); }
        }
      `}</style>

      {/* Centerpiece — drifts up + fades as the user scrolls away */}
      <motion.div
        style={{ y, opacity }}
        initial="hidden"
        animate="visible"
        variants={stagger(0.16, 0.1)}
        className="relative flex w-full flex-col items-center"
      >
        {/* Orbit ring flourish — oversized but clipped by section overflow */}
        <motion.div
          variants={fadeIn}
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <svg
            viewBox="0 0 600 600"
            className="aspect-square w-[min(135vmin,70rem)] max-w-none shrink-0"
            style={{ animation: 'hero-orbit 90s linear infinite' }}
            aria-hidden="true"
          >
            <g transform="rotate(-16 300 300)">
              <ellipse
                cx="300"
                cy="300"
                rx="286"
                ry="104"
                fill="none"
                stroke="var(--color-line-bright)"
                strokeWidth="1"
              />
              {/* glowing satellite riding the ring */}
              <circle cx="586" cy="300" r="9" fill="rgba(183, 140, 255, 0.22)" />
              <circle
                cx="586"
                cy="300"
                r="3"
                fill="var(--color-cyan)"
                style={{ filter: 'drop-shadow(0 0 6px rgba(183, 140, 255, 0.9))' }}
              />
            </g>
          </svg>
        </motion.div>

        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <motion.p variants={fadeUp} className="eyebrow mb-7">
            {'// computer science + robotics — carnegie mellon'}
          </motion.p>

          <motion.h1
            aria-label="Paul Colombo"
            variants={stagger(0.26, 0)}
            className="font-bold uppercase tracking-tight"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.6rem, 10vw, 8rem)',
              lineHeight: 1.04,
            }}
          >
            <DisplayLine word="PAUL" />
            <DisplayLine word="COLOMBO" aurora />
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-7 max-w-md text-base text-[var(--color-fg-muted)] md:text-lg"
          >
            Building robots that see. Class of 2028.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <MagneticLink variant="solid" href="#projects" onClick={scrollTo('#projects')}>
              View Projects <FiArrowDown aria-hidden="true" />
            </MagneticLink>
            <MagneticLink variant="ghost" href="#resume" onClick={scrollTo('#resume')}>
              Resume <FiArrowUpRight aria-hidden="true" />
            </MagneticLink>
          </motion.div>
        </div>
      </motion.div>

      <div className="vignette" />

      {/* Scroll cue — fades out with the same scroll-linked opacity */}
      <motion.div style={{ opacity }} className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.6, ease: EASE }}
          className="flex flex-col items-center gap-3"
        >
          <span
            className="pl-[0.3em] text-[10px] uppercase tracking-[0.3em] text-[var(--color-fg-faint)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            scroll
          </span>
          <span className="relative block h-14 w-px overflow-hidden">
            <span
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, transparent, var(--color-violet), transparent)',
                animation: 'hero-cue 2.4s ease-in-out infinite',
              }}
            />
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
