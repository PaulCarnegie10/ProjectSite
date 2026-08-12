import { useNavigate } from 'react-router-dom';
import { BsArrowLeft } from 'react-icons/bs';
import Markdown from 'react-markdown';
import { Editable } from '../edit/index.jsx';
import { getSiteText } from '../content/loader.js';

export default function Experience() {
  const navigate = useNavigate();
  const experience = getSiteText('experience');

  return (
    <div>
      <header>
        <button type="button" aria-label="Go back" onClick={() => navigate(-1)}>
          <BsArrowLeft />
        </button>
        <Editable path="site/experience.json#title" as="h1">{experience.title}</Editable>
      </header>

      <Editable path="site/experience.json#body" as="div" multiline>
        <Markdown>{experience.body ?? ''}</Markdown>
      </Editable>
    </div>
  );
}
