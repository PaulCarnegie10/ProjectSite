import { Routes, Route, Navigate } from 'react-router-dom';
import { EditToolbar } from './edit/index.jsx';
import Home from './pages/Home.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
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

        {/* Unknown paths render the detail page's not-found branch, never a crash. */}
        <Route path="*" element={<ProjectDetail />} />
      </Routes>
      <EditToolbar />
    </>
  );
}

export default App;
