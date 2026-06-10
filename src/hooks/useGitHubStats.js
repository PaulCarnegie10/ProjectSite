import { useEffect, useState } from 'react';

const USERNAME = 'PaulCarnegie10';

export default function useGitHubStats() {
  const [user, setUser] = useState(null);
  const [recentRepos, setRecentRepos] = useState([]);
  const [languages, setLanguages] = useState({});
  const [totals, setTotals] = useState({ stars: 0, forks: 0, commits: 0 });
  const [loading, setLoading] = useState({ user: true, repos: true, langs: true, commits: true });

  // Profile
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`https://api.github.com/users/${USERNAME}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => { if (d?.id) setUser(d); })
      .catch(() => {})
      .finally(() => setLoading((s) => ({ ...s, user: false })));
    return () => ctrl.abort();
  }, []);

  // Recent repos (top 2)
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=2`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRecentRepos(d); })
      .catch(() => {})
      .finally(() => setLoading((s) => ({ ...s, repos: false })));
    return () => ctrl.abort();
  }, []);

  // Full repo scan: stars/forks + top languages
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        let all = [];
        for (let page = 1; page <= 10; page++) {
          const r = await fetch(
            `https://api.github.com/users/${USERNAME}/repos?per_page=100&page=${page}&sort=updated`,
            { signal: ctrl.signal }
          );
          if (!r.ok) break;
          const batch = await r.json();
          if (!Array.isArray(batch) || batch.length === 0) break;
          all = all.concat(batch);
          if (batch.length < 100) break;
        }

        const stars = all.reduce((s, r) => s + (r.stargazers_count || 0), 0);
        const forks = all.reduce((s, r) => s + (r.forks_count || 0), 0);

        const langResults = await Promise.all(
          all.map((repo) =>
            fetch(`https://api.github.com/repos/${USERNAME}/${repo.name}/languages`, { signal: ctrl.signal })
              .then((r) => (r.ok ? r.json() : {}))
              .catch(() => ({}))
          )
        );
        const counts = {};
        langResults.forEach((langs) => {
          Object.entries(langs).forEach(([lang, bytes]) => {
            counts[lang] = (counts[lang] || 0) + bytes;
          });
        });
        const top = Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .reduce((o, [k, v]) => ({ ...o, [k]: v }), {});

        setTotals((t) => ({ ...t, stars, forks }));
        setLanguages(top);
      } catch {
        /* ignore */
      } finally {
        setLoading((s) => ({ ...s, langs: false }));
      }
    })();
    return () => ctrl.abort();
  }, []);

  // Approximate commit count across recent repos
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100`, { signal: ctrl.signal });
        if (!r.ok) return;
        const repos = await r.json();
        const counts = await Promise.all(
          repos.map(async (repo) => {
            try {
              const res = await fetch(
                `https://api.github.com/repos/${USERNAME}/${repo.name}/commits?per_page=1`,
                { signal: ctrl.signal }
              );
              if (!res.ok) return 0;
              const link = res.headers.get('Link');
              if (link) {
                const m = link.match(/page=(\d+)>; rel="last"/);
                if (m) return parseInt(m[1], 10);
              }
              const commits = await res.json();
              return Array.isArray(commits) ? commits.length : 0;
            } catch {
              return 0;
            }
          })
        );
        const total = counts.reduce((s, n) => s + n, 0);
        setTotals((t) => ({ ...t, commits: total }));
      } catch {
        /* ignore */
      } finally {
        setLoading((s) => ({ ...s, commits: false }));
      }
    })();
    return () => ctrl.abort();
  }, []);

  return { user, recentRepos, languages, totals, loading, username: USERNAME };
}
