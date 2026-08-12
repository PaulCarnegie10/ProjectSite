import { BsLinkedin, BsGithub, BsEnvelopeFill } from 'react-icons/bs';
import { FiArrowUpRight } from 'react-icons/fi';
import SectionHeading from '../components/SectionHeading.jsx';
import site from '../content/site.json';

const METHODS = [
  {
    label: site.contact.methods.email.label,
    handle: site.contact.methods.email.handle,
    href: `mailto:${site.socials.email}`,
    Icon: BsEnvelopeFill,
  },
  {
    label: site.contact.methods.github.label,
    handle: site.contact.methods.github.handle,
    href: site.socials.github,
    Icon: BsGithub,
  },
  {
    label: site.contact.methods.linkedin.label,
    handle: site.contact.methods.linkedin.handle,
    href: site.socials.linkedin,
    Icon: BsLinkedin,
  },
];

export default function Contact() {
  return (
    <section id="contact" className="relative mx-auto max-w-6xl px-6 py-32 md:py-44">
      <SectionHeading
        index="06"
        eyebrow={site.contact.eyebrow}
        align="center"
        title={
          <>
            {site.contact.titlePre}
            <span className="text-aurora">{site.contact.titleAccent}</span>
            {site.contact.titlePost}
          </>
        }
      />

      {/* Pulled up under the heading (SectionHeading carries mb-14) */}
      <p className="mx-auto -mt-8 max-w-md text-center text-base text-[var(--color-fg-muted)]">
        {site.contact.intro}
      </p>

      <div className="mt-16 grid gap-5 md:grid-cols-3">
        {METHODS.map(({ label, handle, href, Icon }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="glass group relative flex flex-col items-center rounded-2xl p-8 text-center transition-colors duration-200 hover:border-[var(--color-line-bright)] hover:bg-[var(--color-surface-hover)]"
          >
            <FiArrowUpRight
              aria-hidden="true"
              className="absolute right-5 top-5 h-5 w-5 text-[var(--color-fg-faint)] transition-colors duration-200 group-hover:text-[var(--color-violet-bright)]"
            />
            <span className="glass flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200 group-hover:border-[var(--color-line-bright)]">
              <Icon
                aria-hidden="true"
                className="h-5 w-5 text-[var(--color-fg-muted)] transition-colors duration-200 group-hover:text-[var(--color-violet-bright)]"
              />
            </span>
            <span
              className="mt-6 text-xs uppercase tracking-[0.28em] text-[var(--color-violet)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {label}
            </span>
            <span className="mt-1.5 break-words text-sm text-[var(--color-fg-muted)]">{handle}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
