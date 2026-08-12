/* eslint-disable react-refresh/only-export-components -- harness entry point, not a refresh boundary */
// Harness page: renders every edit primitive at least once against the mock
// server's fixture tree. Nothing here ships; it exists so each flow can be
// driven end to end without the real edit server.

import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Editable,
  EditableGallery,
  EditableImage,
  EditableVideos,
  EditToolbar,
} from '@edit/index.jsx';

// Stand-in for the Site team's markdown renderer. Its output is what the
// #body slot receives as children, which is exactly why that slot must pass
// `rawValue` — reading innerText back off this would mangle the source.
function renderMarkdown(src) {
  return String(src)
    .split(/```/)
    .map((chunk, i) =>
      i % 2 ? (
        <pre key={i} className="md-code">
          <code>{chunk.replace(/^\w*\n/, '')}</code>
        </pre>
      ) : (
        chunk
          .split(/\n{2,}/)
          .filter((para) => para.trim())
          .map((para, j) => <p key={`${i}-${j}`}>{para.trim()}</p>)
      ),
    );
}

function useFixture() {
  const [state, setState] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    fetch('/__harness/state')
      .then((r) => r.json())
      .then(setState)
      .catch((e) => setErr(String(e)));
  }, []);
  return { state, err };
}

function Project({ p, showEmptySlots }) {
  const md = `projects/${p.slug}/index.md`;
  return (
    <article className="card" data-slug={p.slug}>
      <Editable as="h3" path={`${md}#title`}>
        {p.data.title}
      </Editable>
      <Editable as="p" className="sub" path={`${md}#blurb`}>
        {p.data.blurb}
      </Editable>

      <h2>hero — EditableImage</h2>
      <EditableImage path={`${md}#hero`} src={p.heroUrl} alt={`${p.data.title} hero`} className="hero" />

      <h2>gallery — EditableGallery</h2>
      <div className="grid">
        <EditableGallery
          path={`${md}#gallery`}
          items={p.gallery}
          renderItem={(item, i) => <img key={item.name} src={item.src} alt={`shot ${i + 1}`} />}
        />
      </div>

      <h2>videos — EditableVideos{showEmptySlots ? ' (empty slot)' : ''}</h2>
      <div className="grid">
        <EditableVideos
          path={`${md}#videos`}
          items={p.videos}
          renderItem={(item) => <video key={item.name} src={item.src} controls muted playsInline />}
        />
      </div>

      <h2>body — Editable multiline + rawValue (children are rendered markdown)</h2>
      <Editable as="div" className="prose" path={`${md}#body`} multiline rawValue={p.body}>
        {renderMarkdown(p.body)}
      </Editable>
    </article>
  );
}

function App() {
  const { state, err } = useFixture();
  const reset = useCallback(async () => {
    await fetch('/__harness/reset', { method: 'POST' });
    location.reload();
  }, []);

  if (err) return <p>Harness state failed: {err}</p>;
  if (!state) return <p>loading fixture…</p>;

  const first = state.projects[0];
  const rest = state.projects.slice(1);

  return (
    <>
      <Editable as="h1" path="site/home.json#heroTitle">
        {state.home.heroTitle}
      </Editable>
      <Editable as="p" className="sub" path="site/home.json#heroSubtitle">
        {state.home.heroSubtitle}
      </Editable>

      {/* Project links: the toolbar reads slugs off these for reorder/delete. */}
      <nav>
        {state.projects.map((p) => (
          <a key={p.slug} href={`/projects/${p.slug}`} onClick={(e) => e.preventDefault()}>
            {p.slug}
          </a>
        ))}
      </nav>
      <p className="rule">
        fixture <code>{state.contentRoot}</code>{' '}
        <button type="button" className="reset" onClick={reset}>
          reset fixture
        </button>
      </p>

      <h2>falsy-src EditableImage (contract §3.2 prod parity)</h2>
      {/* With edit mode OFF this must render nothing and fire no image request;
          with edit mode ON it becomes an empty drop target. */}
      <div id="falsy-src-probe">
        <EditableImage path="projects/bee-tracker/index.md#hero" src={null} alt="" className="hero" />
      </div>

      <h2>site/home.json#intro — Editable multiline</h2>
      <Editable as="div" className="body" path="site/home.json#intro" multiline>
        {state.home.intro}
      </Editable>

      <h2>project — every primitive</h2>
      <Project p={first} />

      <h2>other projects — empty video slots, no renderItem gallery</h2>
      {rest.map((p) => (
        <article className="card" key={p.slug} data-slug={p.slug}>
          <Editable as="h3" path={`projects/${p.slug}/index.md#title`}>
            {p.data.title}
          </Editable>
          <div className="grid">
            {/* no renderItem: the primitive falls back to a default thumbnail in dev */}
            <EditableGallery path={`projects/${p.slug}/index.md#gallery`} items={p.gallery} />
          </div>
          <EditableVideos path={`projects/${p.slug}/index.md#videos`} items={p.videos} />
        </article>
      ))}

      <EditToolbar />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
