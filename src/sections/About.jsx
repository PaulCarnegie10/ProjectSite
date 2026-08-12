import SectionHeading from '../components/SectionHeading.jsx';
import site from '../content/site.json';

const CHIPS = site.about.chips;

// Position + border edges for the four corner brackets.
const BRACKETS = [
  '-top-2.5 -left-2.5 border-t border-l',
  '-top-2.5 -right-2.5 border-t border-r',
  '-bottom-2.5 -left-2.5 border-b border-l',
  '-bottom-2.5 -right-2.5 border-b border-r',
];

export default function About() {
  return (
    <section id="about" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <SectionHeading
        index="01"
        eyebrow={site.about.eyebrow}
        title={
          <>
            {site.about.titlePre}
            <span className="text-aurora">{site.about.titleAccent}</span>
            {site.about.titlePost}
          </>
        }
      />

      <div className="grid items-start gap-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
        {/* ── Photo ── */}
        <div className="mx-auto w-full max-w-sm md:mx-0">
          <div>
            <div className="relative">
              {/* corner brackets */}
              {BRACKETS.map((cls) => (
                <span
                  key={cls}
                  aria-hidden
                  className={`absolute h-5 w-5 ${cls}`}
                  style={{ borderColor: 'var(--color-line-bright)' }}
                />
              ))}
              <img
                src={`${import.meta.env.BASE_URL}Paul-Profile.jpg`}
                alt="Paul Colombo"
                className="aspect-[4/5] w-full rounded-2xl object-cover ring-1 ring-[var(--color-line)]"
              />
            </div>

            {/* mono caption strip */}
            <div className="mt-5 flex items-center gap-3">
              <p
                className="text-[0.65rem] lowercase tracking-[0.18em] text-[var(--color-fg-faint)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {site.about.caption}
              </p>
              <span className="glow-line min-w-8 flex-1" />
            </div>
          </div>
        </div>

        {/* ── Text ── */}
        <div className="flex flex-col gap-6">
          <p className="max-w-xl text-2xl font-light leading-snug text-[var(--color-fg)] md:text-3xl">
            {site.about.paragraph1Pre}
            <span className="text-aurora">{site.about.paragraph1Accent1}</span>
            {site.about.paragraph1Mid}
            <span className="text-aurora">{site.about.paragraph1Accent2}</span>
            {site.about.paragraph1Post}
          </p>

          <p className="max-w-xl text-base leading-relaxed text-[var(--color-fg-muted)]">
            {site.about.paragraph2}
          </p>

          {/* stat chips */}
          <ul className="mt-2 flex flex-wrap gap-3">
            {CHIPS.map((chip) => (
              <li
                key={chip}
                className="glass rounded-full px-5 py-2 text-xs tracking-[0.18em] text-[var(--color-fg-muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
