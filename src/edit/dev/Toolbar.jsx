// __EDIT_DEV_ONLY__ — the edit-mode toolbar.
//
// Mounting this is OPTIONAL for the text/asset primitives: mode lives in a
// module-level store, not in a provider. The toolbar just owns the toggle and
// the structural operations (add / reorder / delete project).

import { useCallback, useEffect, useRef, useState } from 'react';
import { createProject, deleteProject, ping, reloadSoon, reorderProjects } from './api.js';
import { setEditMode, useEditMode } from './store.js';
import { ensureStyles } from './styles.js';
import { toast, toastError } from './toast.js';

export const DEV_ONLY = '__EDIT_DEV_ONLY__';

const SLUG_RE = /\/projects\/([A-Za-z0-9][A-Za-z0-9._-]*?)\/?(?:[?#].*)?$/;

/**
 * The wire spec has no "list projects" endpoint, so the toolbar reads the slugs
 * off the page. DOM order is the current display order, which is exactly the
 * order the reorder list should start from.
 */
function discoverSlugs() {
  const out = [];
  const seen = new Set();
  const push = (slug) => {
    if (!slug || seen.has(slug) || slug === 'index.html') return;
    seen.add(slug);
    out.push(slug);
  };
  const here = SLUG_RE.exec(globalThis.location?.pathname || '');
  for (const a of document.querySelectorAll('a[href]')) {
    const m = SLUG_RE.exec(a.getAttribute('href') || '');
    if (m) push(m[1]);
  }
  if (here) push(here[1]);
  return out;
}

function Switch({ on, onChange }) {
  return (
    <button
      type="button"
      className="pe-switch"
      data-pe-on={on ? '1' : '0'}
      data-pe-action="toggle"
      aria-pressed={on}
      onClick={() => onChange(!on)}
    >
      <span className="pe-switch-track">
        <span className="pe-switch-knob" />
      </span>
      <span>Edit mode</span>
    </button>
  );
}

function AddPanel({ onDone }) {
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const clean = title.trim();
    if (!clean || busy) return;
    setBusy(true);
    try {
      const res = await createProject(clean);
      toast(`Created ${res.slug}. Reloading…`, { kind: 'ok' });
      onDone();
      reloadSoon();
    } catch (err) {
      toastError(err, 'Creating project');
      setBusy(false);
    }
  };
  return (
    <div className="pe-toolbar-body">
      <input
        className="pe-input"
        autoFocus
        placeholder="Project title"
        value={title}
        data-pe-input="new-project-title"
        disabled={busy}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onDone();
        }}
      />
      <p className="pe-note">Makes content/projects/&lt;slug&gt;/index.md with a stub body.</p>
      <div className="pe-btnrow">
        <button type="button" className="pe-btn" data-pe-action="create" disabled={busy} onClick={submit}>
          {busy ? 'Creating…' : 'Create'}
        </button>
        <button type="button" className="pe-btn" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ReorderPanel({ slugs, onDone }) {
  const [list, setList] = useState(slugs);
  const [busy, setBusy] = useState(false);
  const move = (i, delta) => {
    const j = i + delta;
    if (j < 0 || j >= list.length) return;
    const next = list.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
  };
  const save = async () => {
    setBusy(true);
    try {
      await reorderProjects(list);
      toast('Order saved. Reloading…', { kind: 'ok' });
      onDone();
      reloadSoon();
    } catch (err) {
      toastError(err, 'Saving order');
      setBusy(false);
    }
  };
  if (!list.length) {
    return (
      <div className="pe-toolbar-body">
        <p className="pe-note">No project links on this page. Open the projects page and try again.</p>
        <div className="pe-btnrow">
          <button type="button" className="pe-btn" onClick={onDone}>
            Close
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="pe-toolbar-body">
      <ul className="pe-list" data-pe-list="reorder">
        {list.map((slug, i) => (
          <li key={slug}>
            <span className="pe-ord">{i + 1}</span>
            <span className="pe-list-slug">{slug}</span>
            <button
              type="button"
              className="pe-btn"
              data-pe-action={`up:${slug}`}
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              className="pe-btn"
              data-pe-action={`down:${slug}`}
              disabled={i === list.length - 1}
              onClick={() => move(i, 1)}
            >
              ↓
            </button>
          </li>
        ))}
      </ul>
      <div className="pe-btnrow" style={{ marginTop: 8 }}>
        <button type="button" className="pe-btn" data-pe-action="save-order" disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save order'}
        </button>
        <button type="button" className="pe-btn" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function DeletePanel({ slugs, onDone }) {
  const [slug, setSlug] = useState(slugs[0] || '');
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!slug || busy) return;
    setBusy(true);
    try {
      const res = await deleteProject(slug);
      console.info('[edit] project trashed →', res.trashed);
      toast(`${slug} moved to ${res.trashed}. Reloading…`, { kind: 'ok' });
      onDone();
      reloadSoon();
    } catch (err) {
      toastError(err, `Deleting ${slug}`);
      setBusy(false);
      setArmed(false);
    }
  };
  return (
    <div className="pe-toolbar-body">
      {slugs.length ? (
        <select
          className="pe-input"
          value={slug}
          data-pe-input="delete-slug"
          onChange={(e) => {
            setSlug(e.target.value);
            setArmed(false);
          }}
        >
          {slugs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="pe-input"
          placeholder="project slug"
          value={slug}
          data-pe-input="delete-slug"
          onChange={(e) => setSlug(e.target.value)}
        />
      )}
      <p className="pe-note">Nothing is erased. The folder moves to content/.trash/.</p>
      <div className="pe-btnrow">
        {armed ? (
          <button
            type="button"
            className="pe-btn pe-btn-danger"
            data-pe-action="delete-confirm"
            disabled={busy}
            onClick={remove}
          >
            {busy ? 'Deleting…' : `Really delete ${slug}`}
          </button>
        ) : (
          <button
            type="button"
            className="pe-btn pe-btn-danger"
            data-pe-action="delete-arm"
            disabled={!slug}
            onClick={() => setArmed(true)}
          >
            Delete
          </button>
        )}
        <button type="button" className="pe-btn" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function DevEditToolbar({ projects }) {
  const editMode = useEditMode();
  const [panel, setPanel] = useState(null);
  const [status, setStatus] = useState(null);
  const [slugs, setSlugs] = useState([]);
  const mounted = useRef(true);

  useEffect(() => {
    ensureStyles();
    mounted.current = true;
    ping()
      .then((res) => mounted.current && setStatus({ ok: true, ...res }))
      .catch((err) => mounted.current && setStatus({ ok: false, message: err.message }));
    return () => {
      mounted.current = false;
    };
  }, []);

  // Ctrl/Cmd+Shift+E toggles edit mode from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        setEditMode(!editMode);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editMode]);

  const openPanel = useCallback(
    (name) => {
      const found = Array.isArray(projects) && projects.length ? projects : discoverSlugs();
      setSlugs(found);
      setPanel((p) => (p === name ? null : name));
    },
    [projects],
  );

  const close = useCallback(() => setPanel(null), []);

  let statusLine = 'checking edit server…';
  let bad;
  if (status && status.ok) {
    statusLine = `${status.contentRoot} · webp ${status.sharp ? 'on' : 'off'} · h264 ${status.ffmpeg ? 'on' : 'off'}`;
  } else if (status) {
    statusLine = 'edit server not running';
    bad = '1';
  }

  return (
    <div className="pe-toolbar" data-edit-dev={DEV_ONLY} data-pe-on={editMode ? '1' : '0'}>
      <div className="pe-toolbar-row">
        <Switch on={editMode} onChange={setEditMode} />
        <span className="pe-toolbar-title">dev</span>
      </div>
      {editMode ? (
        <div className="pe-toolbar-row">
          <div className="pe-btnrow">
            <button
              type="button"
              className="pe-btn"
              data-pe-action="panel-add"
              data-pe-on={panel === 'add' ? '1' : undefined}
              onClick={() => openPanel('add')}
            >
              Add project
            </button>
            <button
              type="button"
              className="pe-btn"
              data-pe-action="panel-reorder"
              data-pe-on={panel === 'reorder' ? '1' : undefined}
              onClick={() => openPanel('reorder')}
            >
              Reorder
            </button>
            <button
              type="button"
              className="pe-btn pe-btn-danger"
              data-pe-action="panel-delete"
              data-pe-on={panel === 'delete' ? '1' : undefined}
              onClick={() => openPanel('delete')}
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}
      {editMode && panel === 'add' ? <AddPanel onDone={close} /> : null}
      {editMode && panel === 'reorder' ? <ReorderPanel slugs={slugs} onDone={close} /> : null}
      {editMode && panel === 'delete' ? <DeletePanel slugs={slugs} onDone={close} /> : null}
      <div className="pe-toolbar-row">
        <span className="pe-status" data-pe-bad={bad}>
          {statusLine}
        </span>
      </div>
    </div>
  );
}
