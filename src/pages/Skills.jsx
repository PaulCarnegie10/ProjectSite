import { useNavigate } from 'react-router-dom';
import { BsArrowLeft } from 'react-icons/bs';
import { Editable } from '../edit/index.jsx';
import { getSiteText } from '../content/loader.js';

export default function Skills() {
  const navigate = useNavigate();
  const skills = getSiteText('skills');
  const categories = skills.categories ?? [];

  // Page heading comes from the nav entry that points here - no literals.
  const nav = getSiteText('nav');
  const navIndex = (nav.links ?? []).findIndex((link) => link.path === '/skills');
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

      {categories.map((category, c) => (
        <section key={category.name ?? c}>
          <Editable path={`site/skills.json#categories.${c}.name`} as="h2">
            {category.name}
          </Editable>
          <Editable path={`site/skills.json#categories.${c}.note`} as="p">
            {category.note}
          </Editable>

          <ul>
            {(category.skills ?? []).map((skill, s) => (
              <li key={skill.name ?? s}>
                <Editable path={`site/skills.json#categories.${c}.skills.${s}.name`} as="h3">
                  {skill.name}
                </Editable>
                <Editable
                  path={`site/skills.json#categories.${c}.skills.${s}.level`}
                  as="span"
                >
                  {skill.level}
                </Editable>
                <progress value={skill.level ?? 0} max={100} />
                <Editable path={`site/skills.json#categories.${c}.skills.${s}.note`} as="p">
                  {skill.note}
                </Editable>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
