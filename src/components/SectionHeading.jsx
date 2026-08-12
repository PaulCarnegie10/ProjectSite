// Uniform section header: mono index/eyebrow line + display-font title.
// `title` may be a node, e.g. <>Tools I <span className="text-aurora">reach for</span>.</>
export default function SectionHeading({ index, eyebrow, title, align = 'left', className = '' }) {
  const right = align === 'right';
  const center = align === 'center';
  return (
    <div
      className={`mb-14 flex flex-col gap-4 ${center ? 'items-center text-center' : right ? 'items-end text-right' : ''} ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="eyebrow">
          [ {index} ] <span className="text-[var(--color-fg-faint)]">//</span> {eyebrow}
        </span>
        <span className="glow-line w-16" />
      </div>
      <h2
        className="max-w-3xl font-[var(--font-display)] text-[clamp(1.7rem,4.5vw,3.2rem)] font-bold leading-[1.1] tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
    </div>
  );
}
