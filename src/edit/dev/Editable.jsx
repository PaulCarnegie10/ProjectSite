// __EDIT_DEV_ONLY__ — click-to-edit text primitive.
//
// Edit mode off  -> renders exactly what the production stub renders.
// Edit mode on   -> click to edit. Single line uses contentEditable in place;
//                   multiline (or any slot given `rawValue`) overlays a textarea
//                   anchored to the element.
//
// `rawValue` is the edit buffer whenever `children` are rendered output rather
// than the source string — a markdown-rendered #body being the case that matters.
// When it is set, innerText is never read back, and the overlay is forced even
// for a single-line slot, because committing innerText would mangle the source.
// Esc cancels. Blur or Ctrl/Cmd+Enter commits -> POST /__edit/text.
// The new value is applied optimistically and reverted (with a toast) if the
// write fails. Text edits never reload the page.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { saveText } from './api.js';
import { useEditMode } from './store.js';
import { ensureStyles } from './styles.js';
import { toastError } from './toast.js';

export const DEV_ONLY = '__EDIT_DEV_ONLY__';

const MIN_W = 320;
const MIN_H = 180;

function childText(children) {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  return null;
}

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function clampRect(r) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(Math.max(r.width, MIN_W), vw - 24);
  const height = Math.min(Math.max(r.height + 40, MIN_H), vh - 24);
  const left = Math.min(Math.max(r.left, 12), Math.max(12, vw - width - 12));
  const top = Math.min(Math.max(r.top, 12), Math.max(12, vh - height - 12));
  return { left, top, width, height };
}

export function DevEditable({
  as = 'span',
  path,
  multiline = false,
  className,
  children,
  // Optional, additive: the source text to edit when `children` are rendered
  // output rather than a plain string (e.g. markdown-rendered #body). Reading
  // innerText back off rendered markdown would mangle it, so when this is
  // present it is the ONLY edit buffer — innerText is never consulted.
  rawValue,
}) {
  const Tag = as;
  const editMode = useEditMode();
  const [override, setOverride] = useState(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rev, setRev] = useState(0);
  const [rect, setRect] = useState(null);
  const hostRef = useRef(null);
  const draftRef = useRef('');

  const active = editMode && Boolean(path);
  const hasRaw = typeof rawValue === 'string';
  const explicit = hasRaw ? rawValue : childText(children);
  const currentText = override ?? explicit;
  const shown = override ?? children;
  // rawValue means children are rendered output, so the in-place contentEditable
  // path (which commits innerText) would write mangled source. Force the overlay.
  const useOverlay = multiline || hasRaw;

  useEffect(() => {
    if (active) ensureStyles();
  }, [active]);

  // Leaving edit mode with an editor open: drop the editor, keep the value.
  useEffect(() => {
    if (!editMode && editing) {
      setEditing(false);
      setRev((r) => r + 1);
    }
  }, [editMode, editing]);

  const commit = useCallback(
    async (next, prevOverride) => {
      setEditing(false);
      setRev((r) => r + 1);
      const before = prevOverride ?? explicit;
      if (next === before) return;
      setOverride(next); // optimistic
      setBusy(true);
      try {
        await saveText(path, next);
      } catch (err) {
        setOverride(prevOverride);
        setRev((r) => r + 1);
        toastError(err, `Saving ${path}`);
      } finally {
        setBusy(false);
      }
    },
    [explicit, path],
  );

  const cancel = useCallback(() => {
    setEditing(false);
    setRev((r) => r + 1);
  }, []);

  const open = useCallback(
    (e) => {
      if (!active || editing || busy) return;
      // Let real links/buttons inside the slot still work with a modifier.
      if (e && (e.metaKey || e.ctrlKey || e.altKey)) return;
      e?.preventDefault();
      // Never fall back to innerText when rawValue was supplied.
      const seed = currentText ?? (hasRaw ? '' : (hostRef.current?.innerText ?? ''));
      draftRef.current = seed;
      if (useOverlay) {
        const r = hostRef.current?.getBoundingClientRect();
        if (r) setRect(clampRect(r));
      }
      setEditing(true);
    },
    [active, busy, currentText, editing, hasRaw, useOverlay],
  );

  // Keep the overlay glued to the element while the page scrolls/resizes.
  useLayoutEffect(() => {
    if (!editing || !useOverlay) return undefined;
    const update = () => {
      const r = hostRef.current?.getBoundingClientRect();
      if (r) setRect(clampRect(r));
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [editing, useOverlay]);

  // Focus + caret to end for the in-place editor.
  useEffect(() => {
    if (!editing || useOverlay) return;
    const node = hostRef.current;
    if (!node) return;
    node.focus();
    const sel = window.getSelection?.();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [editing, useOverlay]);

  if (!active) {
    return (
      <Tag key={rev} className={className}>
        {shown}
      </Tag>
    );
  }

  const inPlace = editing && !useOverlay;

  const tag = (
    <Tag
      key={rev}
      ref={hostRef}
      className={cx(className, 'pe-editable')}
      data-edit-dev={DEV_ONLY}
      data-pe-on="1"
      data-pe-path={path}
      data-pe-editing={editing ? '1' : undefined}
      data-pe-busy={busy ? '1' : undefined}
      data-pe-dim={editing && useOverlay ? '1' : undefined}
      title={editing ? undefined : `Click to edit — ${path}`}
      role={editing ? 'textbox' : 'button'}
      tabIndex={editing ? undefined : 0}
      contentEditable={inPlace || undefined}
      suppressContentEditableWarning={inPlace || undefined}
      spellCheck={inPlace || undefined}
      onClick={open}
      onKeyDown={(e) => {
        if (!editing) {
          if (e.key === 'Enter' || e.key === ' ') open(e);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          cancel();
          return;
        }
        if (e.key === 'Enter' && (!useOverlay || e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          const text = (hostRef.current?.innerText ?? '').replace(/\s*\n+\s*/g, ' ').trim();
          commit(text, override);
        }
      }}
      onPaste={(e) => {
        if (!inPlace) return;
        e.preventDefault();
        const text = (e.clipboardData?.getData('text/plain') ?? '').replace(/\s+/g, ' ');
        document.execCommand('insertText', false, text);
      }}
      onBlur={() => {
        if (!inPlace) return;
        const text = (hostRef.current?.innerText ?? '').replace(/\s*\n+\s*/g, ' ').trim();
        commit(text, override);
      }}
    >
      {shown}
    </Tag>
  );

  if (!editing || !useOverlay || !rect) return tag;

  return (
    <>
      {tag}
      {createPortal(
        <div
          className="pe-overlay-editor"
          data-edit-dev={DEV_ONLY}
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        >
          <textarea
            autoFocus
            defaultValue={draftRef.current}
            aria-label={`Edit ${path}`}
            onChange={(e) => {
              draftRef.current = e.target.value;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                cancel();
              } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                commit(e.target.value, override);
              }
            }}
            onBlur={(e) => commit(e.target.value, override)}
          />
          <div className="pe-overlay-hint">
            <span>{path}</span>
            <span>
              <button
                type="button"
                className="pe-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={cancel}
              >
                Esc — cancel
              </button>{' '}
              <button
                type="button"
                className="pe-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(draftRef.current, override)}
              >
                Ctrl+Enter — save
              </button>
            </span>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
