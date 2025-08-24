import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import { CodeBlock, dracula } from 'react-code-blocks';

import {useState, useEffect} from 'react';
import { Container, Row, Col, Card, ProgressBar, Button, Image, Carousel} from 'react-bootstrap';
import { BsGithub, BsLinkedin, BsEnvelopeFill, BsArrowLeft } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

const TabbedCodeBlock = ({ tabs = [] }) => {
  const safeTabs = Array.isArray(tabs) && tabs.length > 0
    ? tabs
    : [{ label: 'Untitled', language: 'text', code: '' }];
  const [activeIdx, setActiveIdx] = useState(0);
  const idx = Math.min(activeIdx, safeTabs.length - 1);
  const active = safeTabs[idx];
  const hasCode = typeof active.code === 'string' && active.code.length > 0;

  const tabBaseStyle = {
    border: '1px solid rgba(167, 139, 250, 0.35)',
    color: '#f4f2ff',
    background: 'transparent',
    padding: '4px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
  };

  return (
    <div style={{
      marginTop: '30px',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '90%',
      border: '2px solid rgba(167, 139, 250, 0.2)',
      borderRadius: '12px',
      background: 'rgba(21, 18, 37, 0.65)'
    }}>
      <div role="tablist" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 8px 6px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap'
      }}>
        {safeTabs.map((t, i) => {
          const isActive = i === idx;
          return (
            <button
              type="button"
              key={`${t.label}-${i}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveIdx(i)}
              style={{
                ...tabBaseStyle,
                background: isActive ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
                borderColor: isActive ? 'rgba(167, 139, 250, 0.75)' : 'rgba(167, 139, 250, 0.35)'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '8px' }}>
        {hasCode ? (
          <CodeBlock
            text={active.code}
            language={active.language || 'text'}
            showLineNumbers={true}
            theme={dracula}
          />
        ) : (
          <pre style={{ margin: 0, height: '100%', width: '100%', color: 'rgba(255,255,255,0.55)' }}>{'// No code provided'}</pre>
        )}
      </div>
    </div>
  );
};

const TabbedImageTabs = ({ tabs = [] }) => {
  const safeTabs = Array.isArray(tabs) && tabs.length > 0
    ? tabs
    : [{ label: 'Image', src: '', alt: 'No image' }];
  const [activeIdx, setActiveIdx] = useState(0);
  const idx = Math.min(activeIdx, safeTabs.length - 1);
  const active = safeTabs[idx];
  const [imgOpacity, setImgOpacity] = useState(1);
  const [hoverIdx, setHoverIdx] = useState(-1);
  useEffect(() => {
    const t = setTimeout(() => setImgOpacity(1), 40);
    return () => clearTimeout(t);
  }, [idx]);

  const tabBaseStyle = {
    color: '#f4f2ff',
    background: 'transparent',
    padding: '2px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    border: 'none',
  };

  return (
    <div style={{
      marginBottom: '50px',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background: 'transparent'
    }}>
      <div role="tablist" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap'
      }}>
        {safeTabs.map((t, i) => {
          const isActive = i === idx;
          return (
            <button
              type="button"
              key={`${t.label}-${i}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => { setImgOpacity(0); setActiveIdx(i); }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(-1)}
              style={{
                ...tabBaseStyle,
                color: isActive ? '#c4b5fd' : (hoverIdx === i ? '#ded0ff' : '#f4f2ff'),
                borderBottom: isActive ? '2px solid #a78bfa' : '2px solid transparent',
                transform: hoverIdx === i ? 'translateY(-1px)' : 'translateY(0)',
                transition: 'color 180ms ease, transform 150ms ease, border-color 200ms ease'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div style={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '10px',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.03)',
        opacity: imgOpacity,
        transform: imgOpacity < 1 ? 'scale(0.995)' : 'scale(1)',
        transition: 'opacity 320ms ease, transform 320ms ease'
      }}>
        {active.src ? (
          <img
            src={active.src}
            alt={active.alt || active.label}
            onLoad={() => setImgOpacity(1)}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', transition: 'transform 300ms ease' }}
          />
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.55)' }}>No image provided</div>
        )}
      </div>
    </div>
  );
};

export default function Portfolio() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="page-split-bg text-light min-vh-100 d-flex flex-column justify-content-end">
        <header className='header-area-norm' style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-10px)', transition: 'opacity 500ms ease, transform 500ms ease' }}>
            <Container fluid className='welcome-header d-flex align-items-center gap-2 p-0'>
            <button type="button" className="back-link" aria-label="Go back" onClick={() => navigate(-1)}>
                <BsArrowLeft />
            </button>
            <h1 className="display-5 mb-1" style={{ margin: 0 }}>Portfolio Website</h1>
            </Container>
        </header>
        <Container className='Project-Top-Bar' style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-6px)', transition: 'opacity 500ms ease, transform 500ms ease' }}>
            <Container className='Project-Top-Panel'>
                <div style={{
                  marginTop: '10px',
                  width: '100%',
                  height: '98%',
                  padding: '4px 8px',
                  overflow: 'auto',
                  background: 'transparent',
                  borderLeft: '3px solid rgba(167, 139, 250, 0.3)'
                }}>
                  <h2 style={{ marginTop: 0, marginBottom: '8px' }}>About the TM  project</h2>
                  <p style={{ opacity: 0.9 }}>
                    The goal of this project is to use lidar sensors and Java to render a detailed 3d map of the terrain. This project is still in progress.
                  </p>
                  <ul style={{ marginBottom: 0, opacity: 0.9 }}>
                    <li>Utilizes JavaFX</li>
                    <li>Based on an Arduino Uno Wifi</li>
                    <li>Gathers magnometer, accelerometer, and gyroscope data for position</li>
                    <li>Uses a lidar for ranging measurements</li>
                  </ul>
                </div>
            </Container>
            <Container className='Project-Top-Panel'>
                <TabbedImageTabs
                  tabs={[
                    { label: 'Elevation', src: 'https://picsum.photos/seed/terrain-1/900/600', alt: 'Elevation view' },
                    { label: 'Slope', src: 'https://picsum.photos/seed/terrain-2/900/600', alt: 'Slope shading' },
                    { label: 'Contours', src: 'https://picsum.photos/seed/terrain-3/900/600', alt: 'Contour lines' }
                  ]}
                />
            </Container>
        </Container>
        <Container className='Project-Bottom-Bar' style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(6px)', transition: 'opacity 500ms ease 120ms, transform 500ms ease 120ms' }}>
            <Container className='Project-Bottom-Panel'>
                <TabbedCodeBlock
                    tabs={[
                      {
                        label: 'Hello.java',
                        language: 'java',
                        code: `public class Hello {\n  public static void main(String[] args) {\n    System.out.println("Hi");\n  }\n}`
                      },
                      {
                        label: 'Utils.java',
                        language: 'java',
                        code: `class Utils {\n  static String greet(String name) {\n    return "Hi, " + name;\n  }\n}`
                      }
                    ]}
                />
            </Container>
            <Container className='Project-Bottom-Panel'>
                <TabbedCodeBlock
                    tabs={[
                      { label: 'Empty.java', language: 'java', code: '' },
                      { label: 'Readme.txt', language: 'text', code: '' }
                    ]}
                />
            </Container>
        </Container>
    </div>);
}
