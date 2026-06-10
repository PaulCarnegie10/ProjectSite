import SectionHeading from '../components/SectionHeading.jsx';
import ProjectBlock from '../components/ProjectBlock.jsx';
import { PROJECTS } from '../data/projects.js';

// Header sits in the usual max-w container; the project slabs themselves
// are full-bleed and alternate sides via each project's `side` field.
export default function Projects() {
  return (
    <section id="projects" className="relative">
      <div className="mx-auto max-w-6xl px-6 pt-28 md:pt-36">
        <SectionHeading
          index="02"
          eyebrow="Selected Work"
          title={
            <>
              Things I&rsquo;ve <span className="text-aurora">built</span> &amp; shipped.
            </>
          }
        />
      </div>

      {PROJECTS.map((p) => (
        <ProjectBlock key={p.index} {...p} />
      ))}
    </section>
  );
}
