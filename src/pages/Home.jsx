import { Link } from 'react-router-dom';
import { BsGithub, BsLinkedin, BsEnvelopeFill } from 'react-icons/bs';
import { Editable } from '../edit/index.jsx';
import { getSiteText } from '../content/loader.js';

const SOCIAL_ICONS = { linkedin: BsLinkedin, github: BsGithub, email: BsEnvelopeFill };

export default function Home() {
  const home = getSiteText('home');
  const nav = getSiteText('nav');
  const socials = home.socials ?? [];
  const infoCards = home.infoCards ?? [];
  const navLinks = nav.links ?? [];

  return (
    <div>
      <header>
        <Editable path="site/home.json#heroTitle" as="h1">{home.heroTitle}</Editable>
        <Editable path="site/home.json#heroSubtitle" as="p">{home.heroSubtitle}</Editable>

        {/* Lives in public/, not content/ - BASE_URL keeps it correct under /ProjectSite/. */}
        <img src={`${import.meta.env.BASE_URL}Paul-Profile.jpg`} alt="" width={240} height={240} />

        <ul>
          {socials.map((social, i) => {
            const Icon = SOCIAL_ICONS[social.kind];
            const isExternal = typeof social.url === 'string' && social.url.startsWith('http');
            return (
              <li key={social.url ?? i}>
                <a
                  href={social.url}
                  {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {Icon ? <Icon size={22} aria-hidden="true" /> : null}
                  <Editable path={`site/home.json#socials.${i}.label`} as="span">
                    {social.label}
                  </Editable>
                </a>
              </li>
            );
          })}
        </ul>
      </header>

      <Editable path="site/home.json#intro" as="p" multiline>{home.intro}</Editable>

      <section>
        {infoCards.map((card, i) => (
          <article key={card.label ?? i}>
            <Editable path={`site/home.json#infoCards.${i}.label`} as="h2">{card.label}</Editable>
            <Editable path={`site/home.json#infoCards.${i}.value`} as="p">{card.value}</Editable>
          </article>
        ))}
      </section>

      <nav>
        {navLinks.map((link, i) => (
          <article key={link.path ?? i}>
            <Link to={link.path}>
              <Editable path={`site/nav.json#links.${i}.label`} as="h2">{link.label}</Editable>
            </Link>
            <Editable path={`site/nav.json#links.${i}.blurb`} as="p">{link.blurb}</Editable>
          </article>
        ))}
      </nav>
    </div>
  );
}
