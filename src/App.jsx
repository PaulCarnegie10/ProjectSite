import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './Home.jsx';
import News from './pages/News.jsx';
import ProjectsIndex from './pages/ProjectsIndex.jsx';
import ProjectDeepDive from './pages/ProjectDeepDive.jsx';

// Scroll to the hash target after route changes (e.g. /#about from a
// subpage), otherwise jump to the top of the new page.
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/projects" element={<ProjectsIndex />} />
        <Route path="/projects/:slug" element={<ProjectDeepDive />} />
      </Routes>
    </>
  );
}
