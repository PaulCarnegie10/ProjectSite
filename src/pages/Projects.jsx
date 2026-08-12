import { Link, useNavigate } from 'react-router-dom';
import { BsArrowLeft } from 'react-icons/bs';
import { Editable } from '../edit/index.jsx';
import { getProjects, getSiteText } from '../content/loader.js';

export default function Projects() {
  const navigate = useNavigate();
  const projects = getProjects();

  // Page heading comes from the nav entry that points here - no literals.
  const nav = getSiteText('nav');
  const navIndex = (nav.links ?? []).findIndex((link) => link.path === '/projects');
  const navLink = nav.links?.[navIndex];

  return (
    <div>
      <header>
        <button type="button" aria-label="Go back" onClick={() => navigate(-1)}>
          <BsArrowLeft />
        </button>
        {navLink ? (
          <Editable path={`site/nav.json#links.${navIndex}.label`} as="h1">
            {navLink.label}
          </Editable>
        ) : null}
      </header>

      <ul>
        {projects.map((project) => (
          <li key={project.slug}>
            <Link to={`/projects/${project.slug}`}>
              <Editable path={`projects/${project.slug}/index.md#title`} as="h2">
                {project.title}
              </Editable>
            </Link>
            {project.heroUrl ? (
              <img src={project.heroUrl} alt={project.title} />
            ) : null}
            <Editable path={`projects/${project.slug}/index.md#blurb`} as="p">
              {project.blurb}
            </Editable>
          </li>
        ))}
      </ul>
    </div>
  );
}
