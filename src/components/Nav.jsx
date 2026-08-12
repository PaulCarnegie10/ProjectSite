import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BsGithub, BsLinkedin, BsEnvelopeFill } from 'react-icons/bs';
import site from '../content/site.json';

const LINKS = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'news', label: 'News' },
  { id: 'resume', label: 'Resume' },
  { id: 'contact', label: 'Contact' },
];

const SOCIALS = [
  { label: 'GitHub', href: site.socials.github, Icon: BsGithub },
  { label: 'LinkedIn', href: site.socials.linkedin, Icon: BsLinkedin },
  { label: 'Email', href: `mailto:${site.socials.email}`, Icon: BsEnvelopeFill },
];

// Burger → X without motion: the open state is a static transform applied
// instantly, no transition, so nothing on the page ever animates.
const BAR_OPEN = ['translateY(7px) rotate(45deg)', null, 'translateY(-7px) rotate(-45deg)'];

export default function Nav() {
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const onHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      // No section is active while the hero fills the viewport
      if (window.scrollY < window.innerHeight * 0.4) setActive('');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track the section in view (home page only)
  useEffect(() => {
    if (!onHome) {
      setActive('');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    LINKS.forEach((link) => {
      const el = document.getElementById(link.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onHome, location.key]);

  // Lock body scroll while the mobile overlay is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const goTo = (e, id) => {
    e.preventDefault();
    setOpen(false);
    if (onHome) {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
          scrolled && !open
            ? 'border-b border-[var(--color-line)] bg-[rgba(20,19,18,0.86)] backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            onClick={(e) => {
              setOpen(false);
              if (onHome) {
                e.preventDefault();
                window.scrollTo({ top: 0 });
              }
            }}
            className="font-[var(--font-mono)] text-sm tracking-[0.18em] text-[var(--color-fg)] transition-colors duration-200 hover:text-[var(--color-violet-bright)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            PC<span className="text-aurora">//</span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <li key={link.id} className="relative">
                <a
                  href={`/#${link.id}`}
                  onClick={(e) => goTo(e, link.id)}
                  className={`relative z-10 rounded-full px-4 py-2 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.18em] transition-colors duration-200 ${
                    active === link.id
                      ? 'text-[var(--color-violet-bright)]'
                      : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                  }`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {link.label}
                </a>
                {active === link.id && <span className="glass absolute inset-0 rounded-full" />}
              </li>
            ))}
          </ul>

          {/* Mobile burger */}
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="relative z-50 flex h-10 w-10 items-center justify-center lg:hidden"
          >
            <span className="relative block h-3.5 w-6">
              <span
                className="absolute top-0 left-0 block h-px w-6 bg-[var(--color-fg)]"
                style={{ transform: open ? BAR_OPEN[0] : undefined }}
              />
              <span
                className="absolute top-[7px] left-0 block h-px w-6 bg-[var(--color-fg)]"
                style={{ opacity: open ? 0 : 1 }}
              />
              <span
                className="absolute bottom-0 left-0 block h-px w-6 bg-[var(--color-fg)]"
                style={{ transform: open ? BAR_OPEN[2] : undefined }}
              />
            </span>
          </button>
        </nav>
      </header>

      {/* Mobile full-screen overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex flex-col justify-between bg-[rgba(20,19,18,0.97)] px-8 pb-10 pt-28 lg:hidden">
          <ul className="flex flex-col gap-5">
            {LINKS.map((link, i) => (
              <li key={link.id}>
                <a
                  href={`/#${link.id}`}
                  onClick={(e) => goTo(e, link.id)}
                  className="flex items-baseline gap-4 text-3xl font-semibold tracking-tight text-[var(--color-fg)] transition-colors duration-200 hover:text-[var(--color-violet-bright)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <span className="eyebrow">0{i + 1}</span>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-6">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                aria-label={label}
                className="text-[var(--color-fg-muted)] transition-colors duration-200 hover:text-[var(--color-violet-bright)]"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
