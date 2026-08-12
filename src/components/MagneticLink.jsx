import { Link } from 'react-router-dom';

// Styled pill link. The name is historical — the magnet behaviour is gone,
// but the props API is unchanged so call sites did not have to move.
// variant: 'solid' (accent fill) or 'ghost' (surface outline).
// Pass `to` for router links, `href` for external.
export default function MagneticLink({
  to,
  href,
  onClick,
  children,
  variant = 'ghost',
  className = '',
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5 font-[var(--font-mono)] text-xs uppercase tracking-[0.22em] transition-colors duration-200 select-none';
  const styles =
    variant === 'solid'
      ? 'font-medium bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent-hover)]'
      : 'glass text-[var(--color-fg)] hover:border-[var(--color-line-bright)] hover:text-[var(--color-violet-bright)]';

  const props = {
    onClick,
    style: { fontFamily: 'var(--font-mono)' },
    className: `${base} ${styles} ${className}`,
    ...rest,
  };

  if (to) {
    return (
      <Link to={to} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  );
}
