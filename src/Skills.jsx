import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { BsArrowLeft } from "react-icons/bs";
import { FaPython, FaJava, FaJs, FaReact, FaGithub, FaServer, FaCode, FaTools, FaBrain, FaMobile } from "react-icons/fa";
import { SiCplusplus, SiTypescript, SiMongodb, SiPostgresql, SiDocker, SiKubernetes, SiJenkins, SiFigma, SiLinux, SiMacos, SiC } from "react-icons/si";
import { TbBrandVscode } from "react-icons/tb";

import { Container, Row, Col, Card, ProgressBar, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const skillCategories = [
  {
    title: "Programming Languages",
    icon: FaCode,
    description: "Core programming languages I work with",
    skills: [
      { name: "", level: 95, icon: SiC, description: "Data structures, memory management, and algorithms" },
      { name: "C++", level: 85, icon: SiCplusplus, description: "Systems programming, performance optimization" },
      { name: "Java", level: 90, icon: FaJava, description: "Object-oriented programming, algorithms" },
      { name: "JavaScript", level: 85, icon: FaJs, description: "Web development, frontend frameworks" },
      { name: "Python", level: 90, icon: FaPython, description: "Data science, machine learning, and automation" },
    ]
  },
  {
    title: "Frontend Development",
    icon: FaReact,
    description: "Modern web development technologies",
    skills: [
      { name: "HTML/CSS", level: 90, icon: FaCode, description: "Semantic markup and responsive design" },
      { name: "React", level: 85, icon: FaReact, description: "Component-based UI development" },
      { name: "Bootstrap", level: 80, icon: FaCode, description: "Rapid UI development framework" },
      { name: "Responsive Design", level: 80, icon: FaCode, description: "Mobile-first design principles" }
    ]
  },
  {
    title: "Data Science & ML",
    icon: FaBrain,
    description: "Machine learning and data analysis",
    skills: [
      { name: "NumPy", level: 85, icon: FaCode, description: "Numerical computing and arrays" },
      { name: "Pandas", level: 80, icon: FaCode, description: "Data manipulation and analysis" },
      { name: "Scikit-learn", level: 75, icon: FaCode, description: "Machine learning algorithms" },
      { name: "TensorFlow", level: 65, icon: FaCode, description: "Deep learning framework" },
      { name: "OpenCV", level: 70, icon: FaCode, description: "Computer vision and image processing" }
    ]
  },
  {
    title: "Robotics & Hardware",
    icon: FaMobile,
    description: "Robotics and embedded systems",
    skills: [
      { name: "Arduino", level: 80, icon: FaCode, description: "Microcontroller programming" },
      { name: "Raspberry Pi", level: 75, icon: FaCode, description: "Single-board computer projects" },
      { name: "ROS", level: 70, icon: FaCode, description: "Robot Operating System" },
      { name: "Computer Vision", level: 75, icon: FaCode, description: "Image processing and object detection" }
    ]
  },
  {
    title: "Backend & Databases",
    icon: FaServer,
    description: "Server-side development and data storage",
    skills: [
      { name: "Node.js", level: 75, icon: FaCode, description: "Server-side JavaScript runtime" },
      { name: "MongoDB", level: 70, icon: SiMongodb, description: "NoSQL document database" },
      { name: "PostgreSQL", level: 65, icon: SiPostgresql, description: "Relational database management" },
      { name: "REST APIs", level: 80, icon: FaCode, description: "API design and development" }
    ]
  },
  {
    title: "Development Tools",
    icon: FaCode,
    description: "Integrated development environments",
    skills: [
      { name: "VS Code", level: 90, icon: TbBrandVscode, description: "Primary code editor" },
      { name: "IntelliJ IDEA", level: 80, icon: FaCode, description: "Java development IDE" },
      { name: "Eclipse", level: 70, icon: FaCode, description: "Multi-language IDE" },
      { name: "Figma", level: 65, icon: SiFigma, description: "UI/UX design and prototyping" }
    ]
  },
];

const getProgressVariant = (level) => {
  if (level >= 85) return 'success';
  if (level >= 70) return 'info';
  if (level >= 55) return 'warning';
  return 'danger';
};

const getLevelLabel = (level) => {
  if (level >= 90) return 'Expert';
  if (level >= 80) return 'Advanced';
  if (level >= 70) return 'Intermediate';
  if (level >= 55) return 'Beginner';
  return 'Learning';
};

export default function Skills() {
  const navigate = useNavigate();

  return (
    <div className="page-split-norm text-light min-vh-100 d-flex flex-column justify-content-end">
      <header className='header-area-norm'>
        <Container fluid className='welcome-header d-flex align-items-center gap-2 p-0'>
          <button type="button" className="back-link" aria-label="Go back" onClick={() => navigate(-1)}>
            <BsArrowLeft />
          </button>
          <h1 className="display-5 mb-1" style={{ margin: 0 }}>Skills</h1>
        </Container>
      </header>

      <Container fluid className="skills-container">
        <Row className="g-4">
          {skillCategories.map((category, categoryIndex) => {
            const CategoryIcon = category.icon;
            return (
              <Col key={categoryIndex} xs={12} lg={6} xl={4}>
                <Card className="skill-category-card h-100" bg="dark" text="light">
                  <Card.Header className="d-flex align-items-center gap-2">
                    <CategoryIcon size={20} className="text-purple" />
                    <h5 className="mb-0">{category.title}</h5>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-light small mb-3">{category.description}</p>
                    {category.skills.map((skill, skillIndex) => {
                      const SkillIcon = skill.icon;
                      return (
                        <div key={skillIndex} className="skill-item mb-3">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <SkillIcon size={16} className="text-purple" />
                              <span className="skill-name">{skill.name}</span>
                              <Badge bg={getProgressVariant(skill.level)} className="skill-level-badge">
                                {getLevelLabel(skill.level)}
                              </Badge>
                            </div>
                            <span className="skill-level">{skill.level}%</span>
                          </div>
                          <ProgressBar 
                            now={skill.level} 
                            variant={getProgressVariant(skill.level)}
                            className="skill-progress"
                            style={{ '--progress-width': `${skill.level}%`, height: '8px' }}
                          />
                          <small className="text-light skill-description">{skill.description}</small>
                        </div>
                      );
                    })}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Additional Info Section */}
        {/* <Row className="mt-5">
          <Col xs={12}>
            <Card className="additional-info-card" bg="dark" text="light">
              <Card.Header>
                <h5 className="mb-0">Additional Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <h6>Operating Systems</h6>
                    <div className="d-flex gap-3 mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <FaCode size={20} className="text-purple" />
                        <span>Windows</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <SiLinux size={20} className="text-purple" />
                        <span>Linux</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <SiMacos size={20} className="text-purple" />
                        <span>macOS</span>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <h6>Currently Learning</h6>
                    <div className="d-flex gap-3 mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <SiKubernetes size={20} className="text-purple" />
                        <span>Kubernetes</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <FaCode size={20} className="text-purple" />
                        <span>Machine Learning</span>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <h6>Certifications</h6>
                    <div className="d-flex gap-3 mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <FaCode size={20} className="text-purple" />
                        <span>Coming Soon</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row> */}
      </Container>
    </div>
  );
}
