import { motion } from 'framer-motion';
import { FiDownload, FiExternalLink, FiFileText } from 'react-icons/fi';
import SectionHeading from '../components/SectionHeading.jsx';
import MagneticLink from '../components/MagneticLink.jsx';
import { VIEWPORT, fadeUp, scaleIn, stagger } from '../lib/motion.js';

const RESUME_URL = `${import.meta.env.BASE_URL}resume.pdf`;

export default function Resume() {
  return (
    <section id="resume" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <SectionHeading
        index="06"
        eyebrow="Resume"
        title={
          <>
            The <span className="text-aurora">paper trail</span>.
          </>
        }
        align="left"
      />

      <div className="grid gap-12 md:grid-cols-[minmax(0,24rem)_1fr] md:items-start">
        {/* Left column — copy + actions */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12, 0.1)}
          className="flex max-w-sm flex-col gap-7"
        >
          <motion.p variants={fadeUp} className="text-[var(--color-fg-muted)] leading-relaxed">
            Prefer it on paper? The full resume — coursework, projects, experience.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
            <MagneticLink href={RESUME_URL} variant="solid" download>
              <FiDownload aria-hidden /> Download PDF
            </MagneticLink>
            <MagneticLink href={RESUME_URL} variant="ghost" target="_blank" rel="noopener noreferrer">
              <FiExternalLink aria-hidden /> Open in tab
            </MagneticLink>
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="text-xs text-[var(--color-fg-faint)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {'// replace public/resume.pdf to update'}
          </motion.p>
        </motion.div>

        {/* Right column — embedded viewer (sm+) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={scaleIn}
          className="glass hidden rounded-2xl p-2 shadow-[0_0_60px_rgba(124,58,237,0.22),0_0_120px_rgba(96,165,250,0.1)] sm:block"
        >
          <div className="aspect-[8.5/11] max-h-[70vh] w-full">
            <object
              data={RESUME_URL}
              type="application/pdf"
              className="h-full w-full rounded-xl"
              aria-label="Resume PDF"
            >
              {/* Shown when the browser can't inline PDFs */}
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-xl bg-[rgba(16,11,34,0.6)] px-8 text-center">
                <FiFileText className="text-3xl text-[var(--color-violet)]" aria-hidden />
                <p
                  className="text-xs text-[var(--color-fg-muted)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  PDF preview unavailable here — download instead
                </p>
                <a
                  href={RESUME_URL}
                  download
                  className="text-sm text-[var(--color-violet-bright)] underline underline-offset-4 hover:text-[var(--color-cyan)]"
                >
                  Download resume.pdf
                </a>
              </div>
            </object>
          </div>
        </motion.div>

        {/* Compact card replaces the viewer below sm */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={scaleIn}
          className="glass block rounded-2xl p-6 sm:hidden"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[rgba(167,139,250,0.08)]">
              <FiFileText className="text-xl text-[var(--color-violet)]" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-[var(--color-fg)]">resume.pdf</p>
              <a
                href={RESUME_URL}
                download
                className="text-xs text-[var(--color-violet-bright)] underline underline-offset-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Download PDF
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
