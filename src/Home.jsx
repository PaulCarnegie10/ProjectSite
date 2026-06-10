import Layout from './components/Layout.jsx';
import Hero from './sections/Hero.jsx';
import About from './sections/About.jsx';
import Projects from './sections/Projects.jsx';
import Skills from './sections/Skills.jsx';
import NewsTeaser from './sections/NewsTeaser.jsx';
import GitHub from './sections/GitHub.jsx';
import Resume from './sections/Resume.jsx';
import Contact from './sections/Contact.jsx';
import Footer from './sections/Footer.jsx';

export default function Home() {
  return (
    <Layout>
      <Hero />
      <About />
      <Projects />
      <Skills />
      <NewsTeaser />
      <GitHub />
      <Resume />
      <Contact />
      <Footer />
    </Layout>
  );
}
