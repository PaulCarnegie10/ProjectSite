import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import SectionHeading from '../components/SectionHeading.jsx';
import ProjectBlock from '../components/ProjectBlock.jsx';
import MagneticLink from '../components/MagneticLink.jsx';
import { PROJECTS } from '../data/projects.js';
import { fadeUp, VIEWPORT } from '../lib/motion.js';

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
        <ProjectBlock key={p.slug} {...p} />
      ))}

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={fadeUp}
        className="mx-auto max-w-6xl px-6 pb-8 pt-16"
      >
        <MagneticLink to="/projects" variant="ghost">
          All projects <FiArrowUpRight className="h-4 w-4" />
        </MagneticLink>
      </motion.div>
    </section>
  );
}
