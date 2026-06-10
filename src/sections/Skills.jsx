import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimationFrame } from 'framer-motion';
import {
  SiPython,
  SiCplusplus,
  SiTypescript,
  SiPytorch,
  SiOpencv,
  SiRos,
  SiArduino,
  SiGit,
  SiLinux,
  SiReact,
} from 'react-icons/si';
import SectionHeading from '../components/SectionHeading.jsx';
import { EASE, VIEWPORT, fadeIn, stagger } from '../lib/motion.js';
import { SKILL_GROUPS } from '../data/skills.js';

// String keys in skills.js → imported icon components.
const ICONS = {
  SiPython,
  SiCplusplus,
  SiTypescript,
  SiPytorch,
  SiOpencv,
  SiRos,
  SiArduino,
  SiGit,
  SiLinux,
  SiReact,
};

// Per-panel accent: violet / blue / cyan, with matching rgba glow.
const DOTS = [
  { color: 'var(--color-violet)', glow: 'rgba(167, 139, 250, 0.6)' },
  { color: 'var(--color-blue)', glow: 'rgba(96, 165, 250, 0.6)' },
  { color: 'var(--color-cyan)', glow: 'rgba(125, 211, 252, 0.6)' },
];

// Panel reveals via parent stagger, then staggers its own chips.
const panelVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, staggerChildren: 0.05, delayChildren: 0.25 },
  },
};

const chipVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
};

// Flat, deduped icon list for the marquee strip.
const MARQUEE_ICONS = [
  ...new Map(
    SKILL_GROUPS.flatMap((g) => g.items)
      .filter((item) => ICONS[item.icon])
      .map((item) => [item.name, { name: item.name, Icon: ICONS[item.icon] }]),
  ).values(),
];

function Chip({ item }) {
  const Icon = ICONS[item.icon];

  if (!Icon) {
    // Empty slot — dashed outline inviting future content.
    return (
      <motion.span
        variants={chipVariants}
        className="inline-flex items-center gap-2 rounded-full border border-dashed border-[var(--color-line)] px-3.5 py-1.5 text-xs text-[var(--color-fg-faint)]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span aria-hidden>+</span>
        {item.name}
      </motion.span>
    );
  }

  return (
    <motion.span
      variants={chipVariants}
      className="group glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-[var(--color-fg-muted)] transition-colors duration-300 hover:border-[var(--color-line-bright)] hover:text-[var(--color-fg)]"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <Icon className="text-sm text-[var(--color-violet)] transition-colors duration-300 group-hover:text-[var(--color-violet-bright)]" />
      {item.name}
    </motion.span>
  );
}

// Infinite icon marquee: two identical lists, track driven by a motion value
// via useAnimationFrame so it can truly pause on hover. One full list width
// scrolls past every 30s; wraps at -50% for a seamless loop.
function IconMarquee({ reduced }) {
  const x = useMotionValue(0);
  const xPct = useTransform(x, (v) => `${v}%`);
  const paused = useRef(false);

  useAnimationFrame((_, delta) => {
    if (reduced || paused.current) return;
    let next = x.get() - (delta / 30000) * 50;
    if (next <= -50) next += 50;
    x.set(next);
  });

  if (reduced) {
    // Static row when prefers-reduced-motion.
    return (
      <div
        aria-hidden
        className="mt-16 flex flex-wrap items-center justify-center gap-8 text-2xl text-[var(--color-fg-faint)] opacity-40 md:mt-20"
      >
        {MARQUEE_ICONS.map(({ name, Icon }) => (
          <Icon key={name} />
        ))}
      </div>
    );
  }

  const fade = 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)';

  return (
    <div
      aria-hidden
      className="mt-16 overflow-hidden md:mt-20"
      style={{ maskImage: fade, WebkitMaskImage: fade }}
      onPointerEnter={() => (paused.current = true)}
      onPointerLeave={() => (paused.current = false)}
    >
      <motion.div className="flex w-max text-[var(--color-fg-faint)]" style={{ x: xPct }}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-14 pr-14 text-2xl opacity-40">
            {MARQUEE_ICONS.map(({ name, Icon }) => (
              <Icon key={name} title={name} />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function Skills() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <section id="skills" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <SectionHeading
        index="03"
        eyebrow="Skills"
        title={
          <>
            Instruments of <span className="text-aurora">perception</span> and{' '}
            <span className="text-aurora">motion</span>.
          </>
        }
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={stagger(0.15, 0.1)}
        className="grid gap-6 md:grid-cols-3"
      >
        {SKILL_GROUPS.map((group, i) => {
          const dot = DOTS[i % DOTS.length];
          return (
            <motion.div
              key={group.label}
              variants={panelVariants}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="glass rounded-2xl p-6 md:p-8"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: dot.color, boxShadow: `0 0 10px ${dot.glow}` }}
                />
                <span
                  className="text-xs uppercase tracking-[0.22em] text-[var(--color-fg)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {group.label}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">{group.blurb}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <Chip key={item.name} item={item} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={fadeIn}>
        <IconMarquee reduced={reduced} />
      </motion.div>
    </section>
  );
}
