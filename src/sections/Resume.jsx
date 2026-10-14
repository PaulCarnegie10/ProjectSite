import { FiDownload, FiExternalLink } from 'react-icons/fi';
import SectionHeading from '../components/SectionHeading.jsx';
import MagneticLink from '../components/MagneticLink.jsx';
import { NEWS } from '../data/news.js';
import site from '../content/site.json';

const RESUME_URL = `${import.meta.env.BASE_URL}resume.pdf`;
// Pre-rendered page image so the resume shows as a flat sheet, not a browser PDF viewer.
const RESUME_IMG = `${import.meta.env.BASE_URL}resume.png`;

export default function Resume() {
  // Section numbers stay contiguous when the News section is hidden (no entries yet).
  const index = NEWS.length ? '05' : '04';

  return (
    <section id="resume" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <SectionHeading
        index={index}
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

      <div className="flex flex-wrap gap-4">
        <MagneticLink href={RESUME_URL} variant="solid" download>
          <FiDownload aria-hidden /> {site.sections.resume.downloadLabel}
        </MagneticLink>
        <MagneticLink href={RESUME_URL} variant="ghost" target="_blank" rel="noopener noreferrer">
          <FiExternalLink aria-hidden /> {site.sections.resume.openInTabLabel}
        </MagneticLink>
      </div>

      <a
        href={RESUME_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-12 block max-w-3xl overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white transition-colors duration-200 hover:border-[var(--color-line-bright)]"
      >
        <img
          src={RESUME_IMG}
          alt={site.sections.resume.imageAlt}
          loading="lazy"
          className="block w-full"
        />
      </a>
    </section>
  );
}
