import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Home.jsx';
import Projects from './Projects.jsx';
import Skills from './Skills.jsx';
import Experience from './Experience.jsx';
import About from './About.jsx';
import TerrainMapper from './TerrainMapper.jsx';
import DrWuCrew from './DrWuCrew.jsx';
import Portfolio from './PortfolioWebsite.jsx';



function App() {
  return (
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="/projects" element={<Projects/>} />
      <Route path="/skills" element={<Skills/>} />
      <Route path="/experience" element={<Experience/>} />
      <Route path="/about" element={<About/>} />
      <Route path="/terrainmapper" element={<TerrainMapper/>} />
      <Route path="/drwucrew" element={<DrWuCrew/>} />
      <Route path="/portfolio" element={<Portfolio/>} />
    </Routes>
  );
}

export default App;