// __EDIT_DEV_ONLY__ — client for the dev edit API (contract: docs/CONTENT_SCHEMA.md §4).
//
// URLs are BARE root-relative on purpose. The site is served under
// base '/ProjectSite/'; the server accepts both forms and clients use bare.
//
// No top-level side effects, no classes with side-effectful statics — this
// module must be droppable by Rollup.

export const DEV_ONLY = '__EDIT_DEV_ONLY__';

const ROOT = '/__edit';

/** @returns {Error & {code: string}} */
function editError(code, message) {
  const err = new Error(message || code);
  err.code = code;
  return err;
}

async function parseJson(res) {
  let text = '';
  try {
    text = await res.text();
  } catch {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const OFFLINE_MSG =
  'Edit server not reachable. Start the site with `npm run dev` and reload this page.';

/** Every response is application/json; failures carry {ok:false,error,message}. */
function unwrap(data, status) {
  if (!data || typeof data.ok !== 'boolean') {
    throw editError(
      'bad_response',
      `Server answered ${status} without an edit-API JSON body. Is the edit middleware installed?`,
    );
  }
  if (!data.ok) {
    throw editError(data.error || 'unknown', data.message || 'Edit request failed.');
  }
  return data;
}

async function call(path, { method = 'POST', body } = {}) {
  let res;
  try {
    res = await fetch(ROOT + path, {
      method,
      headers: {
        accept: 'application/json',
        'x-edit-dev': DEV_ONLY,
        ...(body === undefined ? null : { 'content-type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw editError('offline', OFFLINE_MSG);
  }
  return unwrap(await parseJson(res), res.status);
}

export function ping() {
  return call('/ping', { method: 'GET' });
}

export function saveText(path, value) {
  return call('/text', { body: { path, value } });
}

export function deleteAsset(path, name) {
  return call('/asset', { method: 'DELETE', body: { path, name } });
}

export function createProject(title) {
  return call('/project', { body: { title } });
}

export function deleteProject(slug) {
  return call('/project', { method: 'DELETE', body: { slug } });
}

export function reorderProjects(slugs) {
  return call('/reorder', { body: { slugs } });
}

/**
 * Upload one asset. XHR (not fetch) because we need upload.onprogress.
 *
 * Phases: 'uploading' (determinate) -> 'processing' (indeterminate; the server
 * is running sharp/ffmpeg and a big video takes minutes) -> resolve.
 * No timeout is set: a 93 MB video must never be killed mid-encode.
 *
 * @param {{path: string, file: File, onProgress?: (frac:number, loaded:number, total:number) => void,
 *          onPhase?: (phase: 'uploading'|'processing') => void, signal?: AbortSignal}} opts
 */
export function uploadAsset({ path, file, onProgress, onPhase, signal }) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(editError('aborted', 'Upload cancelled.'));
      return;
    }
    const form = new FormData();
    form.append('path', path);
    form.append('file', file, file.name);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${ROOT}/asset`, true);
    xhr.timeout = 0; // encoding can legitimately take minutes
    xhr.responseType = 'text';
    xhr.setRequestHeader('accept', 'application/json');
    xhr.setRequestHeader('x-edit-dev', DEV_ONLY);

    const onAbort = () => xhr.abort();
    signal?.addEventListener('abort', onAbort);
    const cleanup = () => signal?.removeEventListener('abort', onAbort);

    onPhase?.('uploading');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total, e.loaded, e.total);
    };
    // Bytes are all on the wire; everything after this is server-side encoding.
    xhr.upload.onload = () => {
      onProgress?.(1, file.size, file.size);
      onPhase?.('processing');
    };
    xhr.onload = () => {
      cleanup();
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = null;
      }
      try {
        resolve(unwrap(data, xhr.status));
      } catch (err) {
        reject(err);
      }
    };
    xhr.onerror = () => {
      cleanup();
      reject(editError('offline', OFFLINE_MSG));
    };
    xhr.onabort = () => {
      cleanup();
      reject(editError('aborted', 'Upload cancelled.'));
    };
    xhr.send(form);
  });
}

/** Structural writes change files on disk; the page reloads to pick them up. */
export function reloadSoon(delay = 500) {
  setTimeout(() => {
    globalThis.location?.reload();
  }, delay);
}
