import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import {BsAirplaneEngines, BsAward} from "react-icons/bs";
import { FaLaptopCode } from "react-icons/fa";
import { IoIosBuild } from "react-icons/io";
import { IoIosTimer } from "react-icons/io";
import { FaQuestion } from "react-icons/fa";
import { FaGithub, FaStar, FaCode } from "react-icons/fa";

import {useState, useEffect} from 'react';
import { Container, Row, Col, Card, ProgressBar, Button, Image, Carousel} from 'react-bootstrap';
import { BsGithub, BsLinkedin, BsEnvelopeFill } from 'react-icons/bs';

const cardData = [
  {
    title: 'Projects',
    text: 'Check out what Ive been working on',
    img: 'https://via.placeholder.com/100x160',
    link: '/ProjectSite/projects',
    icon: IoIosBuild 
  },
  {
    title: 'Skills',
    text: 'See what languages and tools I have experience with',
    img: 'https://via.placeholder.com/100x160',
    link: '/ProjectSite/skills',
    icon: FaLaptopCode
  },
  {
    title: 'Experience',
    text: 'Under Construction',
    img: 'https://via.placeholder.com/100x160',
    link: '/ProjectSite/experience',
    icon: IoIosTimer 
  },
  {
    title: 'About',
    text: 'Under Construction',
    img: 'https://via.placeholder.com/100x160',
    link: '/ProjectSite/about',
    icon: FaQuestion
  }
];

const progressCards = [
  { title: 'Build Status', now: 25, variant: 'info', link: '/status' },
  { title: 'Deployment', now: 25, variant: 'warning', link: '/deploy' },
];

// Language colors for the distribution bar - themed to match the website
const languageColors = {
  'JavaScript': '#c4b5fd',
  'TypeScript': '#a78bfa',
  'Python': '#8b5cf6',
  'Java': '#7c3aed',
  'C++': '#6d28d9',
  'C#': '#5b21b6',
  'HTML': '#4c1d95',
  'CSS': '#7c3aed',
  'PHP': '#8b5cf6',
  'Ruby': '#a78bfa',
  'Go': '#c4b5fd',
  'Rust': '#ddd6fe',
  'Swift': '#e0e7ff',
  'Kotlin': '#ede9fe',
  'Scala': '#f3e8ff',
  'R': '#faf5ff',
  'MATLAB': '#fef3c7',
  'Shell': '#fef3c7',
  'Dockerfile': '#fef3c7',
  'Makefile': '#fef3c7',
  'Vue': '#c4b5fd',
  'React': '#a78bfa',
  'Angular': '#8b5cf6',
  'Svelte': '#7c3aed',
  'Next.js': '#6d28d9',
  'Node.js': '#5b21b6',
  'Express': '#4c1d95',
  'Django': '#7c3aed',
  'Flask': '#8b5cf6',
  'Spring': '#a78bfa',
  'Laravel': '#c4b5fd',
  'ASP.NET': '#ddd6fe',
  'Jupyter Notebook': '#e0e7ff',
  'Markdown': '#ede9fe',
  'JSON': '#f3e8ff',
  'YAML': '#faf5ff',
  'XML': '#fef3c7',
  'SQL': '#fef3c7',
  'Assembly': '#fef3c7',
  'Objective-C': '#fef3c7',
  'Perl': '#fef3c7',
  'Haskell': '#fef3c7',
  'Clojure': '#fef3c7',
  'Erlang': '#fef3c7',
  'Elixir': '#fef3c7',
  'F#': '#fef3c7',
  'OCaml': '#fef3c7',
  'Lua': '#fef3c7',
  'Dart': '#fef3c7',
  'Julia': '#fef3c7',
  'Nim': '#fef3c7',
  'Crystal': '#fef3c7',
  'Zig': '#fef3c7',
  'V': '#fef3c7',
  'Carbon': '#fef3c7',
  'Other/Unknown': '#6b7280',
  'default': '#8b5cf6'
};

export default function Home() {
  const [index, setIndex] = useState(0);
  const handleSelect = (selectedIndex) => setIndex(selectedIndex);

  const username = 'PaulCarnegie10';
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [totalCommits, setTotalCommits] = useState(0);
  const [loadingCommits, setLoadingCommits] = useState(true);
  const [languageDistribution, setLanguageDistribution] = useState({});
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [totalStars, setTotalStars] = useState(0);
  const [totalForks, setTotalForks] = useState(0);
  const [actualContributions, setActualContributions] = useState(34); // Your actual GitHub contributions

  // Fetch user profile data
  useEffect(() => {
    const controller = new AbortController();
    fetch(`https://api.github.com/users/${username}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.id) setUserStats(data);
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
    return () => controller.abort();
  }, []);

  // Fetch recent repositories for the side panel
  useEffect(() => {
    const controller = new AbortController();
    fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=2`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRepos(data);
      })
      .catch(() => {})
      .finally(() => setLoadingRepos(false));
    return () => controller.abort();
  }, []);

  // Fetch comprehensive repository data for stats
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchAllRepos = async () => {
      try {
        // Get all repositories (paginated)
        let allRepos = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`, { 
            signal: controller.signal 
          });
          
          if (!response.ok) {
            break;
          }
          
          const repos = await response.json();
          
          if (Array.isArray(repos) && repos.length > 0) {
            allRepos = [...allRepos, ...repos];
            page++;
          } else {
            hasMore = false;
          }
          
          // Safety check to prevent infinite loops
          if (page > 10) {
            hasMore = false;
          }
        }

        // Calculate comprehensive stats
        const languageCounts = {};
        let totalStarsCount = 0;
        let totalForksCount = 0;
        let totalLanguageBytes = 0;

        // Process basic stats first
        allRepos.forEach(repo => {
          totalStarsCount += repo.stargazers_count || 0;
          totalForksCount += repo.forks_count || 0;
        });

        // Fetch detailed language data for each repository
        const languagePromises = allRepos.map(async (repo) => {
          try {
            const langResponse = await fetch(`https://api.github.com/repos/${username}/${repo.name}/languages`, { 
              signal: controller.signal 
            });
            
            if (langResponse.ok) {
              const languages = await langResponse.json();
              return { repoName: repo.name, languages };
            }
            return { repoName: repo.name, languages: {} };
          } catch (error) {
            console.error(`Error fetching languages for ${repo.name}:`, error);
            return { repoName: repo.name, languages: {} };
          }
        });

        const languageResults = await Promise.all(languagePromises);
        
        // Aggregate language data by bytes
        languageResults.forEach(({ repoName, languages }) => {
          Object.entries(languages).forEach(([language, bytes]) => {
            if (!languageCounts[language]) {
              languageCounts[language] = { bytes: 0, repos: new Set() };
            }
            languageCounts[language].bytes += bytes;
            languageCounts[language].repos.add(repoName);
          });
        });

        // Convert to final format and sort by total bytes
        const sortedLanguages = Object.entries(languageCounts)
          .sort(([,a], [,b]) => b.bytes - a.bytes)
          .slice(0, 5)
          .reduce((obj, [language, data]) => {
            obj[language] = data.bytes; // Use actual bytes instead of repo count
            return obj;
          }, {});

        // Calculate total bytes for percentage calculations
        const totalBytesForPercentage = Object.values(sortedLanguages).reduce((sum, bytes) => sum + bytes, 0);

        // Calculate total repos with language data
        const reposWithLanguages = new Set();
        Object.values(languageCounts).forEach(data => {
          data.repos.forEach(repo => reposWithLanguages.add(repo));
        });

        // Add "Other/Unknown" for repos without any language data
        const reposWithoutLanguages = allRepos.length - reposWithLanguages.size;
        if (reposWithoutLanguages > 0) {
          // Estimate bytes for unknown repos (small amount to show they exist)
          const estimatedUnknownBytes = Math.max(1000, totalBytesForPercentage * 0.05); // At least 1KB or 5% of total
          sortedLanguages['Other/Unknown'] = estimatedUnknownBytes;
        }

        // Estimate commits based on repository count and activity
        const estimatedTotalCommits = Math.round(allRepos.length * 25);

        setLanguageDistribution(sortedLanguages);
        setTotalStars(totalStarsCount);
        setTotalForks(totalForksCount);
        setTotalCommits(estimatedTotalCommits);

        console.log('Detailed language analysis:', {
          totalRepos: allRepos.length,
          reposWithLanguages: reposWithLanguages.size,
          reposWithoutLanguages,
          languageBreakdown: languageCounts,
          finalDistribution: sortedLanguages
        });

      } catch (error) {
        console.error('Error fetching repository data:', error);
      } finally {
        setLoadingCommits(false);
        setLoadingLanguages(false);
      }
    };

    fetchAllRepos();

    return () => controller.abort();
  }, []);

  // Freeze top band geometry to the initial viewport height (prevents middle bar from adjusting on height changes)
  useEffect(() => {
    const ih = window.innerHeight;
    const topBandH = Math.round(ih * 0.47);      // original split height ~47vh
    const topBandOffset = Math.round(ih * 0.065); // original offset ~6.5vh
    document.documentElement.style.setProperty('--topBandH', `${topBandH}px`);
    document.documentElement.style.setProperty('--topBandOffset', `${topBandOffset}px`);
  }, []);

  const totalBytes = Object.values(languageDistribution).reduce((sum, bytes) => sum + bytes, 0);

  return (
    <div className="page-split-bg text-light min-vh-100 d-flex flex-column justify-content-end">
      <header className='header-area'>
        <Container fluid className="welcome-header">
          <h1 className="display-5 mb-1">Paul Colombo's Portfolio</h1>
        </Container>

        <Container fluid className='profile-card'>
          <Image src="Paul-Profile.jpg" alt="" style={{maxWidth: 240, maxHeight: 240}} roundedCircle className='border border-4 border-dark'/>
        </Container>

        <Container fluid className="social-bar">
          <div className="d-flex gap-3 flex-wrap">
            <Button
              as="a"
              href="https://www.linkedin.com/in/paul-colombo-09aa18336/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-social"
              size="lg"
              aria-label="LinkedIn"
            >
              <BsLinkedin size={22} aria-hidden="true" />
            </Button>

            <Button
              as="a"
              href="https://github.com/PaulCarnegie10"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-social"
              size="lg"
              aria-label="GitHub"
            >
              <BsGithub size={22} aria-hidden="true" />
            </Button>

            <Button
              as="a"
              href="mailto:pcolombo@andrew.cmu.edu"
              className="btn-social"
              size="lg"
              aria-label="Email"
            >
              <BsEnvelopeFill size={22} aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </header>

      {/* Middle profile info cards between header and side panel */}
      <div className="header-mid-cards" aria-label="Profile information cards">
        <div className="info-card">
          <div className="info-title">School</div>
          <div className="info-body">
            Carnegie Mellon University School of Computer Science
          </div>
        </div>
        <div className="info-card">
          <div className="info-title">Degree Pursuit</div>
          <div className="info-body">
            Bachelors: Computer Science with a Concentration in Robotics 
          </div>
        </div>
        <div className='info-card'>
          <div className='info-title'>Graduation</div>
          <div className='info-body'>Class of 2028</div>
        </div>
        
        {/* GitHub Stats Cards */}
        <div className="info-card github-stats-card">
          <div className="info-title">GitHub Activity</div>
          <div className="github-stats-grid">
            <div className="github-stat-item">
              <FaGithub size={16} className="stat-icon" />
              <span className="stat-number">
                {loadingStats ? '...' : (userStats?.public_repos || 0)}
              </span>
              <span className="stat-label">Repos</span>
            </div>
            <div className="github-stat-item">
              <FaStar size={16} className="stat-icon" />
              <span className="stat-number">
                {loadingCommits ? '...' : totalStars}
              </span>
              <span className="stat-label">Stars</span>
            </div>
            <div className="github-stat-item">
              <FaCode size={16} className="stat-icon" />
              <span className="stat-number">
                {loadingCommits ? '...' : actualContributions}
              </span>
              <span className="stat-label">Commits</span>
            </div>
          </div>
          
          {/* Language Distribution Bar */}
          <div className="language-distribution">
            <div className="language-distribution-title">Top Languages</div>
            <div className="language-distribution-bar">
              {loadingLanguages ? (
                <div className="language-loading">Loading languages...</div>
              ) : Object.keys(languageDistribution).length === 0 ? (
                <div className="language-loading">No language data available</div>
              ) : (
                Object.entries(languageDistribution).map(([language, count], index) => {
                  const percentage = totalBytes > 0 ? (count / totalBytes) * 100 : 0;
                  const color = languageColors[language] || languageColors.default;
                  return (
                    <div
                      key={language}
                      className="language-segment"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                        order: index
                      }}
                      title={`${language}: ${count} repos (${percentage.toFixed(1)}%)`}
                    >
                      <span className="language-label">{language}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="header-side-panel" aria-label="GitHub activity and recent repositories">
        <div className="gh-graph" role="img" aria-label="GitHub contribution graph">
          <img
            src={`https://github-readme-activity-graph.vercel.app/graph?username=${username}&bg_color=0f0d1b&color=c4b5fd&line=a78bfa&point=ffffff&area=true&hide_border=true`}
            alt="GitHub contribution activity graph"
            loading="lazy"
          />
        </div>
        <div className="repo-list">
          <div className="repo-list-header">Recent repositories</div>
          {loadingRepos && <div className="repo-skeleton">Loading...</div>}
          {!loadingRepos && repos.map((r) => (
            <a key={r.id} href={r.html_url} target="_blank" rel="noopener noreferrer" className="repo-item">
              <div className="repo-name">{r.name}</div>
              {r.description && <div className="repo-desc">{r.description}</div>}
              <div className="repo-meta">
                {r.language && <span className="repo-lang">{r.language}</span>}
                <span className="repo-updated">Updated {new Date(r.updated_at).toLocaleDateString()}</span>
                <span className="repo-stars">★ {r.stargazers_count}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <Container fluid className='p-0' style={{ height:'50vh', width:'70vw'}}>
        <Row xs={2} sm={2} md={2} lg={2} className="g-4 h-100">
          {cardData.map((card, idx) => {
            const Icon = card.icon || BsAirplaneEngines;
            return (
              <Col key={idx} className="d-flex">
                <Card
                  as="a"
                  href={card.link}
                  bg="dark"
                  text="light"
                  className="hover-card position-relative overflow-hidden w-100"
                >
                  <div className="card-bg-icon" aria-hidden="true">
                    <Icon />
                  </div>

                  <Card.ImgOverlay className="d-flex flex-column justify-content-end">
                    <Card.Title>{card.title}</Card.Title>
                    <Card.Text>{card.text}</Card.Text>
                  </Card.ImgOverlay>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </div>);
}
