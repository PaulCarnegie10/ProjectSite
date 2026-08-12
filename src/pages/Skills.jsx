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
    <div className="page">
      <header className="page-header">
        <button className="back-button" type="button" aria-label="Go back" onClick={() => navigate(-1)}>
          <BsArrowLeft />
        </button>
        {navLink ? (
          <Editable path={`site/nav.json#links.${navIndex}.label`} as="h1">
            {navLink.label}
          </Editable>
        ) : null}
      </header>

      {categories.map((category, c) => (
        <section className="skill-group" key={category.name ?? c}>
          <Editable path={`site/skills.json#categories.${c}.name`} as="h2">
            {category.name}
          </Editable>
          <Editable path={`site/skills.json#categories.${c}.note`} as="p">
            {category.note}
          </Editable>

          <ul className="skill-list">
            {(category.skills ?? []).map((skill, s) => (
              <li className="skill" key={skill.name ?? s}>
                <Editable path={`site/skills.json#categories.${c}.skills.${s}.name`} as="h3">
                  {skill.name}
                </Editable>
                {/* Level is a number, so it stays read-only: a text edit would
                    write a string into a numeric field. */}
                <span className="skill-level">{skill.level}</span>
                <progress className="skill-meter" value={skill.level ?? 0} max={100} />
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
