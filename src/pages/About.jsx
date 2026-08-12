import { useNavigate } from 'react-router-dom';
import { BsArrowLeft } from 'react-icons/bs';
import Markdown from 'react-markdown';
import { Editable } from '../edit/index.jsx';
import { getSiteText } from '../content/loader.js';

export default function About() {
  const navigate = useNavigate();
  const about = getSiteText('about');

  return (
    <div>
      <header>
        <button type="button" aria-label="Go back" onClick={() => navigate(-1)}>
          <BsArrowLeft />
        </button>
        <Editable path="site/about.json#title" as="h1">{about.title}</Editable>
      </header>

      <Editable path="site/about.json#body" as="div" multiline>
        <Markdown>{about.body ?? ''}</Markdown>
      </Editable>
    </div>
  );
}
