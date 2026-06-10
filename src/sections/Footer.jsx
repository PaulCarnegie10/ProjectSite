import { BsGithub, BsLinkedin, BsEnvelopeFill } from 'react-icons/bs';

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/PaulCarnegie10', Icon: BsGithub },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/paul-colombo-09aa18336/', Icon: BsLinkedin },
  { label: 'Email', href: 'mailto:pcolombo@andrew.cmu.edu', Icon: BsEnvelopeFill },
];

export default function Footer() {
  return (
    <footer className="relative z-10">
      <div className="glow-line" />
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="text-sm font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Paul Colombo
          </span>
          <span className="eyebrow text-[var(--color-fg-faint)]">CS + Robotics — CMU '28</span>
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
          © {new Date().getFullYear()} — Pittsburgh, PA
        </span>
      </div>
    </footer>
  );
}
