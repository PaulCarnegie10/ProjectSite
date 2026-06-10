import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BsGithub, BsLinkedin, BsEnvelopeFill } from 'react-icons/bs';
import { EASE } from '../lib/motion.js';

const LINKS = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'news', label: 'News' },
  { id: 'github', label: 'GitHub' },
  { id: 'resume', label: 'Resume' },
  { id: 'contact', label: 'Contact' },
];

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/PaulCarnegie10', Icon: BsGithub },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/paul-colombo-09aa18336/', Icon: BsLinkedin },
  { label: 'Email', href: 'mailto:pcolombo@andrew.cmu.edu', Icon: BsEnvelopeFill },
];

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
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled && !open
            ? 'border-b border-[var(--color-line)] bg-[rgba(5,3,15,0.7)] backdrop-blur-xl'
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
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="font-[var(--font-mono)] text-sm tracking-[0.18em] text-[var(--color-fg)] transition-colors hover:text-[var(--color-violet-bright)]"
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
                  className={`relative z-10 rounded-full px-4 py-2 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.18em] transition-colors ${
                    active === link.id
                      ? 'text-[var(--color-violet-bright)]'
                      : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                  }`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {link.label}
                </a>
                {active === link.id && (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className="glass absolute inset-0 rounded-full"
                  />
                )}
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
              <motion.span
                animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                className="absolute top-0 left-0 block h-px w-6 bg-[var(--color-fg)]"
              />
              <motion.span
                animate={open ? { opacity: 0 } : { opacity: 1 }}
                className="absolute top-[7px] left-0 block h-px w-6 bg-[var(--color-fg)]"
              />
              <motion.span
                animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                className="absolute bottom-0 left-0 block h-px w-6 bg-[var(--color-fg)]"
              />
            </span>
          </button>
        </nav>
      </header>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed inset-0 z-40 flex flex-col justify-between bg-[rgba(5,3,15,0.96)] px-8 pb-10 pt-28 lg:hidden"
          >
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
              className="flex flex-col gap-5"
            >
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.id}
                  variants={{
                    hidden: { opacity: 0, x: -24 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
                  }}
                >
                  <a
                    href={`/#${link.id}`}
                    onClick={(e) => goTo(e, link.id)}
                    className="flex items-baseline gap-4 text-3xl font-semibold tracking-tight text-[var(--color-fg)] transition-colors hover:text-[var(--color-violet-bright)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <span className="eyebrow">0{i + 1}</span>
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center gap-6"
            >
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={label}
                  className="text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-violet-bright)]"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
