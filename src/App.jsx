import { Routes, Route, Navigate } from 'react-router-dom';
import { EditToolbar } from './edit/index.jsx';
import { getProjects } from './content/loader.js';
import Home from './pages/Home.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail, { NotFound } from './pages/ProjectDetail.jsx';
import Skills from './pages/Skills.jsx';
import Experience from './pages/Experience.jsx';
import About from './pages/About.jsx';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/about" element={<About />} />

        {/* Legacy routes from the hardcoded-page era. */}
        <Route path="/terrainmapper" element={<Navigate to="/projects/terrain-mapping-drone" replace />} />
        <Route path="/drwucrew" element={<Navigate to="/projects/highschool-autograder" replace />} />
        <Route path="/portfolio" element={<Navigate to="/projects/portfolio-website" replace />} />

        {/* Unknown paths get the dedicated not-found view, never a crash. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <EditToolbar projects={getProjects().map((project) => project.slug)} />
    </>
  );
}

export default App;
