// __EDIT_DEV_ONLY__ — drop-target primitives for hero / gallery / videos.
//
// Layout contract: with edit mode ON the rendered item DOM stays identical to
// production (no wrapper elements around renderItem output). All edit chrome —
// outline, label chip, per-item remove, progress — is portalled to <body> and
// positioned over measured rects. The only element ever added in flow is the
// placeholder shown when a slot is empty, because there is otherwise nothing
// to drop on.
//
// Upload goes through XHR so upload.onprogress can drive a determinate bar.
// When the last byte is on the wire we flip to an indeterminate "compressing"
// state with an elapsed clock: a 93 MB video takes minutes on the server and
// the UI must not look hung. No XHR timeout is set, ever.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { deleteAsset, reloadSoon, uploadAsset } from './api.js';
import { useEditMode } from './store.js';
import { ensureStyles } from './styles.js';
import { toast, toastError } from './toast.js';

export const DEV_ONLY = '__EDIT_DEV_ONLY__';

const SLOTS = {
  hero: { label: 'hero', accept: 'image/*', hint: 'drop an image to replace' },
  gallery: { label: 'gallery', accept: 'image/*', hint: 'drop images to add' },
  videos: { label: 'videos', accept: 'video/*', hint: 'drop videos to add' },
};

function slotOf(path) {
  const key = String(path || '').split('#')[1] || '';
  return SLOTS[key] || { label: key || 'asset', accept: undefined, hint: 'drop a file' };
}

function fmtBytes(n) {
  if (!Number.isFinite(n)) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtClock(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function unionRect(rects) {
  let box = null;
  for (const r of rects) {
    if (!r || (!r.width && !r.height)) continue;
    box = box
      ? {
          left: Math.min(box.left, r.left),
          top: Math.min(box.top, r.top),
          right: Math.max(box.right, r.right),
          bottom: Math.max(box.bottom, r.bottom),
        }
      : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  }
  return box;
}

/** Measure the anchor element (or, for display:contents wrappers, its children). */
function useAnchorRects(ref, active, deps) {
  const [state, setState] = useState({ box: null, rects: [] });
  const frame = useRef(0);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const own = el.getBoundingClientRect();
    const useKids = !own.width && !own.height;
    const rects = useKids
      ? Array.from(el.children).map((k) => k.getBoundingClientRect())
      : [own];
    const box = unionRect(rects);
    setState({ box, rects: rects.map((r) => ({ left: r.left, top: r.top, width: r.width, height: r.height })) });
  }, [ref]);

  useEffect(() => {
    if (!active) return undefined;
    // Measure straight away rather than waiting on a frame: a backgrounded tab
    // never fires requestAnimationFrame, which would leave the chrome missing.
    measure();
    const schedule = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', measure);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    const el = ref.current;
    if (ro && el) {
      const own = el.getBoundingClientRect();
      if (own.width || own.height) ro.observe(el);
      for (const k of el.children) ro.observe(k);
    }
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', measure);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, measure, deps]);

  return state;
}

function useUploader(path) {
  const [jobs, setJobs] = useState([]);
  const [over, setOver] = useState(false);
  const [tick, setTick] = useState(0);
  const seq = useRef(0);
  const depth = useRef(0);

  const busy = jobs.some((j) => j.phase === 'uploading' || j.phase === 'processing');

  // Elapsed clock for the indeterminate compressing state.
  useEffect(() => {
    if (!busy) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [busy]);
  void tick;

  const patch = useCallback((id, next) => {
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...next } : j)));
  }, []);

  const run = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;
      let written = 0;
      // Sequential on purpose: video encodes are CPU-bound on the server.
      for (const file of files) {
        const id = (seq.current += 1);
        const controller = new AbortController();
        setJobs((js) =>
          js.concat({
            id,
            name: file.name,
            size: file.size,
            phase: 'uploading',
            progress: 0,
            startedAt: Date.now(),
            phaseAt: Date.now(),
            abort: () => controller.abort(),
          }),
        );
        try {
          const res = await uploadAsset({
            path,
            file,
            signal: controller.signal,
            onProgress: (frac) => patch(id, { progress: frac }),
            onPhase: (phase) => patch(id, { phase, phaseAt: Date.now() }),
          });
          patch(id, { phase: 'done', progress: 1, out: res });
          written += 1;
        } catch (err) {
          patch(id, { phase: 'error', error: err?.message, code: err?.code });
          if (err?.code !== 'aborted') toastError(err, `Uploading ${file.name}`);
        }
      }
      if (written) {
        toast(`${written} file${written > 1 ? 's' : ''} written. Reloading…`, { kind: 'ok' });
        reloadSoon();
      }
    },
    [patch, path],
  );

  const dropProps = {
    onDragEnter: (e) => {
      e.preventDefault();
      depth.current += 1;
      setOver(true);
    },
    onDragOver: (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      setOver(true);
    },
    onDragLeave: (e) => {
      e.preventDefault();
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setOver(false);
    },
    onDrop: (e) => {
      e.preventDefault();
      e.stopPropagation();
      depth.current = 0;
      setOver(false);
      run(e.dataTransfer?.files);
    },
  };

  return { jobs, over, dropProps, run, busy };
}

function Job({ job }) {
  const uploading = job.phase === 'uploading';
  const processing = job.phase === 'processing';
  const pct = Math.round((job.progress || 0) * 100);
  let state;
  if (uploading) state = `${pct}% of ${fmtBytes(job.size)}`;
  else if (processing) state = `compressing… ${fmtClock(Date.now() - job.phaseAt)}`;
  else if (job.phase === 'done')
    state = job.out ? `${fmtBytes(job.out.bytesIn)} → ${fmtBytes(job.out.bytesOut)}` : 'done';
  else state = job.code || 'failed';

  return (
    <div className="pe-job" data-pe-phase={job.phase}>
      <div className="pe-job-head">
        <span className="pe-job-name">{job.name}</span>
        <span className="pe-job-state">{state}</span>
      </div>
      <div className="pe-bar" data-pe-indeterminate={processing ? '1' : undefined}>
        <div
          className="pe-bar-fill"
          style={processing ? undefined : { width: `${job.phase === 'error' ? 100 : pct}%` }}
        />
      </div>
      {processing ? (
        <p className="pe-job-note">
          Server is re-encoding. Video can take a few minutes — leave this tab open.{' '}
          <button type="button" className="pe-link" onClick={job.abort}>
            cancel
          </button>
        </p>
      ) : null}
      {job.phase === 'error' && job.code !== 'aborted' ? (
        <p className="pe-job-err">{job.error}</p>
      ) : null}
    </div>
  );
}

/** Fixed-position chrome portalled to <body>; never affects page layout. */
function AssetChrome({ path, box, rects, items, over, jobs, dropProps, onPick, onRemove }) {
  const inputRef = useRef(null);
  const slot = slotOf(path);
  if (!box) return null;
  const pad = 4;
  const style = {
    left: box.left - pad,
    top: box.top - pad,
    width: box.right - box.left + pad * 2,
    height: box.bottom - box.top + pad * 2,
  };
  const perItem = items && rects.length === items.length;

  return createPortal(
    <div className="pe-chrome" data-edit-dev={DEV_ONLY} data-pe-over={over ? '1' : undefined} style={style}>
      <div className="pe-chrome-outline" />
      <div className="pe-chip" data-pe-path={path} {...dropProps}>
        <span>{slot.label}</span>
        <span className="pe-chip-hint">{slot.hint}</span>
        <button
          type="button"
          className="pe-btn"
          data-pe-action="pick"
          onClick={() => inputRef.current?.click()}
        >
          choose…
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={slot.accept}
          data-pe-input={path}
          className="pe-file"
          onChange={(e) => {
            onPick(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {perItem
        ? rects.map((r, i) => (
            <button
              key={items[i].name ?? i}
              type="button"
              className="pe-x"
              title={`Remove ${items[i].name} from this project`}
              data-pe-remove={items[i].name}
              style={{ left: r.left - box.left + r.width + pad - 22, top: r.top - box.top + pad + 2 }}
              onClick={() => onRemove(items[i].name)}
            >
              ×
            </button>
          ))
        : null}
      {jobs.length ? <div className="pe-jobs">{jobs.map((j) => <Job key={j.id} job={j} />)}</div> : null}
    </div>,
    document.body,
  );
}

function useRemover(path) {
  return useCallback(
    async (name) => {
      try {
        await deleteAsset(path, name);
        toast(`Removed ${name} from this project. Reloading…`, { kind: 'ok' });
        reloadSoon();
      } catch (err) {
        toastError(err, `Removing ${name}`);
      }
    },
    [path],
  );
}

function Placeholder({ label, hint, dropProps, onPick, accept }) {
  const inputRef = useRef(null);
  return (
    <div className="pe-empty" data-edit-dev={DEV_ONLY} {...dropProps}>
      <span className="pe-empty-label">{label}</span>
      <span>{hint}</span>
      <button type="button" className="pe-btn" data-pe-action="pick" onClick={() => inputRef.current?.click()}>
        choose…
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="pe-file"
        onChange={(e) => {
          onPick(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function DevEditableImage({ path, src, alt = '', className }) {
  const editMode = useEditMode();
  const active = editMode && Boolean(path);
  const ref = useRef(null);
  const { jobs, over, dropProps, run } = useUploader(path);
  const { box, rects } = useAnchorRects(ref, active && Boolean(src), src);

  useEffect(() => {
    if (active) ensureStyles();
  }, [active]);

  if (!active) {
    // Edit mode off: match production exactly, including "falsy src renders
    // nothing" (contract §3.2). An <img src=""> re-fetches the page + shows a
    // broken-image icon, so the empty check has to come first.
    if (!src) return null;
    return <img src={src} alt={alt} className={className} />;
  }

  const slot = slotOf(path);
  if (!src) {
    return (
      <Placeholder label={slot.label} hint={slot.hint} accept={slot.accept} dropProps={dropProps} onPick={run} />
    );
  }

  return (
    <>
      <img ref={ref} src={src} alt={alt} className={className} data-pe-path={path} {...dropProps} />
      <AssetChrome
        path={path}
        box={box}
        rects={rects}
        items={null}
        over={over}
        jobs={jobs}
        dropProps={dropProps}
        onPick={run}
        onRemove={() => {}}
      />
    </>
  );
}

function DevAssetList({ path, items, renderItem }) {
  const editMode = useEditMode();
  const active = editMode && Boolean(path);
  const ref = useRef(null);
  const { jobs, over, dropProps, run } = useUploader(path);
  const remove = useRemover(path);
  const { box, rects } = useAnchorRects(ref, active && items.length > 0, items.length);

  useEffect(() => {
    if (active) ensureStyles();
  }, [active]);

  const body = items.map((item, i) =>
    renderItem ? (
      renderItem(item, i)
    ) : (
      <DefaultItem key={item.name ?? i} item={item} path={path} />
    ),
  );

  if (!active) return <>{body}</>;

  const slot = slotOf(path);
  if (!items.length) {
    return (
      <Placeholder label={slot.label} hint={slot.hint} accept={slot.accept} dropProps={dropProps} onPick={run} />
    );
  }

  return (
    <>
      {/* display:contents — this wrapper carries drop handlers but no layout box */}
      <div ref={ref} className="pe-passthrough" data-pe-path={path} {...dropProps}>
        {body}
      </div>
      <AssetChrome
        path={path}
        box={box}
        rects={rects}
        items={items}
        over={over}
        jobs={jobs}
        dropProps={dropProps}
        onPick={run}
        onRemove={remove}
      />
    </>
  );
}

function DefaultItem({ item, path }) {
  const isVideo = String(path).endsWith('#videos');
  return isVideo ? (
    <video className="pe-default-item" src={item.src} controls muted playsInline />
  ) : (
    <img className="pe-default-item" src={item.src} alt={item.name || ''} />
  );
}

export function DevEditableGallery({ path, items = [], renderItem }) {
  return <DevAssetList path={path} items={items} renderItem={renderItem} />;
}

export function DevEditableVideos({ path, items = [], renderItem }) {
  return <DevAssetList path={path} items={items} renderItem={renderItem} />;
}
