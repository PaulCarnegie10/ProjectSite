import { BsGithub, BsLinkedin, BsEnvelopeFill } from 'react-icons/bs';
import site from '../content/site.json';

const SOCIALS = [
  { label: 'GitHub', href: site.socials.github, Icon: BsGithub },
  { label: 'LinkedIn', href: site.socials.linkedin, Icon: BsLinkedin },
  { label: 'Email', href: `mailto:${site.socials.email}`, Icon: BsEnvelopeFill },
];

export default function Footer() {
  return (
    <footer className="relative z-10">
      <div className="glow-line" />
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="text-sm font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {site.footer.name}
          </span>
          <span className="eyebrow text-[var(--color-fg-faint)]">{site.footer.tagline}</span>
        </div>
        <div className="flex items-center gap-5">
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              aria-label={label}
              className="text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-violet-bright)]"
            >
              <Icon className="h-4.5 w-4.5" />
            </a>
          ))}
        </div>
        <span className="font-[var(--font-mono)] text-[10px] tracking-[0.2em] uppercase text-[var(--color-fg-faint)]" style={{ fontFamily: 'var(--font-mono)' }}>
          © {new Date().getFullYear()} — {site.footer.locationSuffix}
        </span>
      </div>
    </footer>
  );
}
