import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const MotionLink = motion.create(Link);

// Button/link that leans toward the cursor. variant: 'solid' (aurora fill)
// or 'ghost' (glass outline). Pass `to` for router links, `href` for external.
export default function MagneticLink({
  to,
  href,
  onClick,
  children,
  variant = 'ghost',
  className = '',
  ...rest
}) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 });
  const sy = useSpring(y, { stiffness: 200, damping: 18 });

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const base =
    'inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5 font-[var(--font-mono)] text-xs uppercase tracking-[0.22em] transition-colors duration-300 select-none';
  const styles =
    variant === 'solid'
      ? 'text-[#261d45] font-medium bg-[linear-gradient(100deg,#ff9ad8,#ff6ec7_35%,#6cc4ff)] shadow-[0_0_24px_rgba(255,110,199,0.35)] hover:shadow-[0_0_36px_rgba(255,110,199,0.55)]'
      : 'glass text-[var(--color-fg)] hover:border-[var(--color-line-bright)] hover:text-[var(--color-violet-bright)]';

  const props = {
    ref,
    onPointerMove: onMove,
    onPointerLeave: onLeave,
    onClick,
    style: { x: sx, y: sy, fontFamily: 'var(--font-mono)' },
    className: `${base} ${styles} ${className}`,
    ...rest,
  };

  if (to) {
    return (
      <MotionLink to={to} {...props}>
        {children}
      </MotionLink>
    );
  }
  return (
    <motion.a
      href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </motion.a>
  );
}
