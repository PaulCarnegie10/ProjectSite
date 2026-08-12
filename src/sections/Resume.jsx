import { FiDownload, FiExternalLink, FiFileText } from 'react-icons/fi';
import SectionHeading from '../components/SectionHeading.jsx';
import MagneticLink from '../components/MagneticLink.jsx';
import site from '../content/site.json';

const RESUME_URL = `${import.meta.env.BASE_URL}resume.pdf`;

export default function Resume() {
  return (
    <section id="resume" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <SectionHeading
        index="06"
        eyebrow={site.sections.resume.eyebrow}
        title={
          <>
            {site.sections.resume.titlePre}
            <span className="text-aurora">{site.sections.resume.titleAccent}</span>
            {site.sections.resume.titlePost}
          </>
        }
        align="left"
      />

      <div className="grid gap-12 md:grid-cols-[minmax(0,24rem)_1fr] md:items-start">
        {/* Left column — copy + actions */}
        <div className="flex max-w-sm flex-col gap-7">
          <p className="text-[var(--color-fg-muted)] leading-relaxed">
            {site.sections.resume.intro}
          </p>

          <div className="flex flex-wrap gap-4">
            <MagneticLink href={RESUME_URL} variant="solid" download>
              <FiDownload aria-hidden /> {site.sections.resume.downloadLabel}
            </MagneticLink>
            <MagneticLink href={RESUME_URL} variant="ghost" target="_blank" rel="noopener noreferrer">
              <FiExternalLink aria-hidden /> {site.sections.resume.openInTabLabel}
            </MagneticLink>
          </div>

          <p
            className="text-xs text-[var(--color-fg-faint)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {site.sections.resume.editHint}
          </p>
        </div>

        {/* Right column — embedded viewer (sm+) */}
        <div className="glass hidden rounded-2xl p-2 sm:block">
          <div className="aspect-[8.5/11] max-h-[70vh] w-full">
            <object
              data={RESUME_URL}
              type="application/pdf"
              className="h-full w-full rounded-xl"
              aria-label="Resume PDF"
            >
              {/* Shown when the browser can't inline PDFs */}
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-xl bg-[var(--color-bg-elevated)] px-8 text-center">
                <FiFileText className="text-3xl text-[var(--color-violet)]" aria-hidden />
                <p
                  className="text-xs text-[var(--color-fg-muted)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {site.sections.resume.previewUnavailable}
                </p>
                <a
                  href={RESUME_URL}
                  download
                  className="text-sm text-[var(--color-violet-bright)] underline underline-offset-4 transition-colors duration-200 hover:text-[var(--color-fg)]"
                >
                  {site.sections.resume.downloadFileLabel}
                </a>
              </div>
            </object>
          </div>
        </div>

        {/* Compact card replaces the viewer below sm */}
        <div className="glass block rounded-2xl p-6 sm:hidden">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-elevated)]">
              <FiFileText className="text-xl text-[var(--color-violet)]" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-[var(--color-fg)]">{site.sections.resume.fileName}</p>
              <a
                href={RESUME_URL}
                download
                className="text-xs text-[var(--color-violet-bright)] underline underline-offset-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {site.sections.resume.downloadLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
