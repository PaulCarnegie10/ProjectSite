import {
  SiPython,
  SiCplusplus,
  SiOpenjdk,
  SiJavascript,
  SiPytorch,
  SiArduino,
  SiReact,
  SiNodedotjs,
  SiVite,
  SiBootstrap,
  SiHtml5,
  SiFirebase,
  SiGit,
  SiLinux,
  SiGradle,
  SiLatex,
  SiKalilinux,
  SiVirtualbox,
} from 'react-icons/si';
import SectionHeading from '../components/SectionHeading.jsx';
import { SKILL_GROUPS } from '../data/skills.js';
import site from '../content/site.json';

// String keys in skills.json → imported icon components. A skill with no
// matching icon still renders as a plain chip.
const ICONS = {
  SiPython,
  SiCplusplus,
  SiOpenjdk,
  SiJavascript,
  SiPytorch,
  SiArduino,
  SiReact,
  SiNodedotjs,
  SiVite,
  SiBootstrap,
  SiHtml5,
  SiFirebase,
  SiGit,
  SiLinux,
  SiGradle,
  SiLatex,
  SiKalilinux,
  SiVirtualbox,
};

// Per-panel marker: steps down the neutral ramp, no glow.
const DOTS = [
  'var(--color-accent)',
  'var(--color-fg-muted)',
  'var(--color-fg-faint)',
  'var(--color-accent-deep)',
];

// Flat, deduped icon list for the strip under the panels.
const STRIP_ICONS = [
  ...new Map(
    SKILL_GROUPS.flatMap((g) => g.items)
      .filter((item) => ICONS[item.icon])
      .map((item) => [item.name, { name: item.name, Icon: ICONS[item.icon] }]),
  ).values(),
];

function Chip({ item }) {
  const Icon = ICONS[item.icon];
  return (
    <span
      className="group glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-[var(--color-fg-muted)] transition-colors duration-200 hover:border-[var(--color-line-bright)] hover:text-[var(--color-fg)]"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {Icon && (
        <Icon className="text-sm text-[var(--color-violet)] transition-colors duration-200 group-hover:text-[var(--color-violet-bright)]" />
      )}
      {item.name}
    </span>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <SectionHeading
        index="03"
        eyebrow={site.sections.skills.eyebrow}
        title={
          <>
            {site.sections.skills.titlePre}
            <span className="text-aurora">{site.sections.skills.titleAccent1}</span>
            {site.sections.skills.titleMid}
            <span className="text-aurora">{site.sections.skills.titleAccent2}</span>
            {site.sections.skills.titlePost}
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {SKILL_GROUPS.map((group, i) => (
          <div key={group.label} className="glass rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-2.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: DOTS[i % DOTS.length] }}
              />
              <span
                className="text-xs uppercase tracking-[0.22em] text-[var(--color-fg)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {group.label}
              </span>
            </div>
            {group.blurb && (
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">{group.blurb}</p>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <Chip key={item.name} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Static icon strip. */}
      <div
        aria-hidden
        className="mt-16 flex flex-wrap items-center justify-center gap-8 text-2xl text-[var(--color-fg-faint)] opacity-40 md:mt-20"
      >
        {STRIP_ICONS.map(({ name, Icon }) => (
          <Icon key={name} />
        ))}
      </div>
    </section>
  );
}
