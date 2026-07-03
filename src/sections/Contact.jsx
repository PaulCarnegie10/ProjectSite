import { motion } from 'framer-motion';
import { BsLinkedin, BsGithub, BsEnvelopeFill } from 'react-icons/bs';
import { FiArrowUpRight } from 'react-icons/fi';
import SectionHeading from '../components/SectionHeading.jsx';
import { VIEWPORT, fadeUp, scaleIn, stagger } from '../lib/motion.js';

const METHODS = [
  {
    label: 'Email',
    handle: 'pcolombo@andrew.cmu.edu',
    href: 'mailto:pcolombo@andrew.cmu.edu',
    Icon: BsEnvelopeFill,
  },
  {
    label: 'GitHub',
    handle: '@PaulCarnegie10',
    href: 'https://github.com/PaulCarnegie10',
    Icon: BsGithub,
  },
  {
    label: 'LinkedIn',
    handle: 'paul-colombo',
    href: 'https://www.linkedin.com/in/paul-colombo-09aa18336/',
    Icon: BsLinkedin,
  },
];

export default function Contact() {
  return (
    <section id="contact" className="relative mx-auto max-w-6xl px-6 py-32 md:py-44">
      {/* Decorative aurora glow behind the heading */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-8 -z-10 h-[26rem] w-[min(42rem,100vw)] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(255,110,199,0.22) 0%, rgba(108,196,255,0.10) 45%, transparent 70%)' }}
      />

      <SectionHeading
        index="07"
        eyebrow="Contact"
        align="center"
        title={<>Let&apos;s <span className="text-aurora">talk</span>.</>}
      />

      {/* Pulled up under the heading (SectionHeading carries mb-14) */}
      <motion.p
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={fadeUp}
        className="mx-auto -mt-8 max-w-md text-center text-base text-[var(--color-fg-muted)]"
      >
        Open to internships, research, and interesting robots.
      </motion.p>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={stagger(0.12, 0.15)}
        className="mt-16 grid gap-5 md:grid-cols-3"
      >
        {METHODS.map(({ label, handle, href, Icon }) => (
          <motion.a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            variants={scaleIn}
            whileHover={{ y: -6, transition: { type: 'spring', stiffness: 280, damping: 20 } }}
            className="glass group relative flex flex-col items-center rounded-2xl p-8 text-center transition-[border-color,box-shadow] duration-300 hover:border-[var(--color-line-bright)] hover:shadow-[0_18px_50px_-16px_rgba(255,110,199,0.5)]"
          >
            <FiArrowUpRight
              aria-hidden="true"
              className="absolute right-5 top-5 h-5 w-5 text-[var(--color-fg-faint)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-violet-bright)]"
            />
            <span className="glass flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-300 group-hover:border-[var(--color-line-bright)] group-hover:bg-[rgba(255,154,216,0.12)]">
              <Icon
                aria-hidden="true"
                className="h-5 w-5 text-[var(--color-fg-muted)] transition-colors duration-300 group-hover:text-[var(--color-violet-bright)]"
              />
            </span>
            <span
              className="mt-6 text-xs uppercase tracking-[0.28em] text-[var(--color-violet)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {label}
            </span>
            <span className="mt-1.5 break-words text-sm text-[var(--color-fg-muted)]">{handle}</span>
          </motion.a>
        ))}
      </motion.div>
    </section>
  );
}
