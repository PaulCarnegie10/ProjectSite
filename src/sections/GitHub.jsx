import { motion, useInView, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { FaGithub, FaStar, FaCodeBranch } from 'react-icons/fa';
import { FiArrowUpRight } from 'react-icons/fi';
import useGitHubStats from '../hooks/useGitHubStats.js';
import SectionHeading from '../components/SectionHeading.jsx';
import { EASE, VIEWPORT, fadeUp, stagger } from '../lib/motion.js';
import site from '../content/site.json';

// Distinct accent shades per language (no longer near-monochrome purple)
const LANGUAGE_COLORS = {
  Python: '#ff6ec7',
  JavaScript: '#fbbf24',
  TypeScript: '#6cc4ff',
  Java: '#fb923c',
  'C++': '#f472b6',
  C: '#94a3b8',
  'C#': '#34d399',
  HTML: '#fb7185',
  CSS: '#38bdf8',
  Shell: '#a3e635',
  Dockerfile: '#67e8f9',
  Jupyter: '#facc15',
  Go: '#22d3ee',
  Rust: '#f97316',
  default: '#ff6ec7',
};

function Counter({ to, loading }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20% 0px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView || loading) return;
    const controls = animate(0, to, {
      duration: 1.4,
      ease: EASE,
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, loading]);

  return (
    <span ref={ref} className="tabular-nums">
      {loading ? '—' : value}
    </span>
  );
}

function StatTile({ Icon, label, value, loading }) {
  return (
    <div className="glass group rounded-2xl p-6 transition-[border-color,box-shadow] duration-300 hover:border-[var(--color-line-bright)] hover:shadow-[0_0_40px_rgba(255,110,199,0.16)]">
      <Icon className="h-5 w-5 text-[var(--color-violet)] transition-colors duration-300 group-hover:text-[var(--color-violet-bright)]" aria-hidden="true" />
      <div
        className="mt-4 text-4xl font-bold tracking-tight text-[var(--color-fg)] md:text-5xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <Counter to={value} loading={loading} />
      </div>
      <div
        className="mt-2 text-[10px] uppercase tracking-[0.24em] text-[var(--color-fg-muted)]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </div>
    </div>
  );
}

export default function GitHub() {
  const { user, recentRepos, languages, totals, loading, username } = useGitHubStats();
  const totalLangBytes = Object.values(languages).reduce((s, n) => s + n, 0);

  return (
    <section id="github" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <SectionHeading
        index="05"
        eyebrow={site.sections.github.eyebrow}
        title={
          <>
            {site.sections.github.titlePre}
            <span className="text-aurora">{site.sections.github.titleAccent}</span>
            {site.sections.github.titlePost}
          </>
        }
      />

      {/* Stat tiles */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={stagger(0.1, 0)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {[
          { Icon: FaGithub, label: site.sections.github.statLabels.repos, value: user?.public_repos || 0, loading: loading.user },
          { Icon: FaStar, label: site.sections.github.statLabels.stars, value: totals.stars, loading: loading.langs },
          { Icon: FaCodeBranch, label: site.sections.github.statLabels.commits, value: totals.commits, loading: loading.commits },
        ].map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <StatTile {...s} />
          </motion.div>
        ))}
      </motion.div>

      {/* Language bar */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={fadeUp}
        className="mt-12"
      >
        <div
          className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-[var(--color-fg-muted)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>{site.sections.github.topLanguages}</span>
          {loading.langs && <span>{site.sections.github.loadingLanguages}</span>}
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)] shadow-[0_0_18px_rgba(255,110,199,0.3)] ring-1 ring-[var(--color-line)]">
          {Object.entries(languages).map(([lang, bytes]) => {
            const pct = totalLangBytes > 0 ? (bytes / totalLangBytes) * 100 : 0;
            return (
              <div
                key={lang}
                title={`${lang} — ${pct.toFixed(1)}%`}
                style={{ width: `${pct}%`, backgroundColor: LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default }}
              />
            );
          })}
        </div>
        <div
          className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-[var(--color-fg-muted)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {Object.entries(languages).map(([lang, bytes]) => {
            const pct = totalLangBytes > 0 ? (bytes / totalLangBytes) * 100 : 0;
            return (
              <span key={lang} className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default }}
                />
                {lang} <span className="tabular-nums opacity-70">{pct.toFixed(0)}%</span>
              </span>
            );
          })}
        </div>
      </motion.div>

      {/* Contribution graph */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={fadeUp}
        className="glass mt-12 overflow-hidden rounded-2xl"
      >
        <img
          src={`https://github-readme-activity-graph.vercel.app/graph?username=${username}&bg_color=1c1533&color=ff9ad8&line=ff6ec7&point=6cc4ff&area=true&hide_border=true`}
          alt={`${username} contribution activity`}
          loading="lazy"
          className="block h-auto w-full"
        />
      </motion.div>

      {/* Recent repos */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={stagger(0.1, 0.1)}
        className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {loading.repos && (
          <div
            className="glass rounded-2xl p-6 text-xs text-[var(--color-fg-muted)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {site.sections.github.loadingRepos}
          </div>
        )}
        {!loading.repos && recentRepos.slice(0, 2).map((r) => (
          <motion.a
            key={r.id}
            href={r.html_url}
            target="_blank"
            rel="noopener noreferrer"
            variants={fadeUp}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="group glass flex flex-col gap-3 rounded-2xl p-6 transition-[border-color,box-shadow] duration-300 hover:border-[var(--color-line-bright)] hover:shadow-[0_8px_32px_rgba(255,110,199,0.18)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--color-fg)] transition-colors group-hover:text-[var(--color-violet-bright)]">
                {r.name}
              </h3>
              <FiArrowUpRight className="text-[var(--color-fg-muted)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-violet-bright)]" />
            </div>
            {r.description && (
              <p className="line-clamp-2 text-sm text-[var(--color-fg-muted)]">{r.description}</p>
            )}
            <div
              className="flex flex-wrap gap-4 text-[11px] text-[var(--color-fg-muted)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {r.language && (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: LANGUAGE_COLORS[r.language] || LANGUAGE_COLORS.default }}
                  />
                  {r.language}
                </span>
              )}
              <span>★ {r.stargazers_count}</span>
              <span className="opacity-70">Updated {new Date(r.updated_at).toLocaleDateString()}</span>
            </div>
          </motion.a>
        ))}
      </motion.div>

      {/* Profile link */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={fadeUp}
        className="mt-8"
      >
        <a
          href={`https://github.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs tracking-[0.18em] text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-violet-bright)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          github.com/{username} <FiArrowUpRight aria-hidden="true" />
        </a>
      </motion.div>
    </section>
  );
}
