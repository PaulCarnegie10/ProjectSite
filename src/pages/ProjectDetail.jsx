import { Link, useNavigate, useParams } from 'react-router-dom';
import { BsArrowLeft } from 'react-icons/bs';
import Markdown from 'react-markdown';
import { Editable, EditableImage, EditableGallery, EditableVideos } from '../edit/index.jsx';
import { getProject, getSiteText } from '../content/loader.js';

/** Shared by the unknown-slug branch below and by App's catch-all route. */
export function NotFound() {
  const nav = getSiteText('nav');
  const navIndex = (nav.links ?? []).findIndex((link) => link.path === '/projects');
  const navLink = nav.links?.[navIndex];
  return (
    <div className="page">
      <h1>Not found</h1>
      {navLink ? (
        <Link className="text-link" to={navLink.path}>
          <Editable path={`site/nav.json#links.${navIndex}.label`} as="span">
            {navLink.label}
          </Editable>
        </Link>
      ) : null}
    </div>
  );
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const project = getProject(slug);

  if (!project) return <NotFound />;

  const base = `projects/${project.slug}/index.md`;

  return (
    <div className="page">
      <header className="page-header detail-header">
        <button className="back-button" type="button" aria-label="Go back" onClick={() => navigate(-1)}>
          <BsArrowLeft />
        </button>
        <Editable path={`${base}#title`} as="h1">{project.title}</Editable>
        <Editable path={`${base}#blurb`} as="p">{project.blurb}</Editable>
        <Editable path={`${base}#date`} as="p">{project.date}</Editable>
      </header>

      {project.tags.length > 0 ? (
        <ul className="tag-list">
          {project.tags.map((tag, i) => (
            <Editable key={tag} path={`${base}#tags.${i}`} as="li">{tag}</Editable>
          ))}
        </ul>
      ) : null}

      {/* Always rendered: with no hero on disk this is the owner's drop target. */}
      <EditableImage
        className="detail-hero"
        path={`${base}#hero`}
        src={project.heroUrl}
        alt={project.title}
      />

      <Editable path={`${base}#body`} as="div" multiline rawValue={project.body}>
        <Markdown>{project.body}</Markdown>
      </Editable>

      <EditableGallery
        path={`${base}#gallery`}
        items={project.gallery}
        renderItem={(item) => (
          <img className="media-item" key={item.name} src={item.src} alt={item.name} />
        )}
      />

      <EditableVideos
        path={`${base}#videos`}
        items={project.videos}
        renderItem={(item) => (
          <video className="media-video" key={item.name} src={item.src} controls preload="metadata" />
        )}
      />

      {project.links.length > 0 ? (
        <ul className="link-list">
          {project.links.map((link, i) => {
            const isExternal = typeof link.url === 'string' && link.url.startsWith('http');
            return (
              <li key={link.url ?? i}>
                <a
                  href={link.url}
                  {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <Editable path={`${base}#links.${i}.label`} as="span">{link.label}</Editable>
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
