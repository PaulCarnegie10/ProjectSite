import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import {BsAirplaneEngines, BsAward} from "react-icons/bs";
import {GoBrowser,GoFileDirectory} from "react-icons/go";

import { CodeBlock, dracula } from 'react-code-blocks';

import {useState} from 'react';
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

export default function TerrainMapper() {
  const navigate = useNavigate();
  return (
    <div className="page-split-bg text-light min-vh-100 d-flex flex-column justify-content-end">
        <header className='header-area-norm'>
            <Container fluid className='welcome-header d-flex align-items-center gap-2 p-0'>
            <button type="button" className="back-link" aria-label="Go back" onClick={() => navigate(-1)}>
                <BsArrowLeft />
            </button>
            <h1 className="display-5 mb-1" style={{ margin: 0 }}>Terrain Mapper</h1>
            </Container>
        </header>
        <Container className='Project-Top-Bar'>
            <Container className='Project-Top-Panel'>
            </Container>
            <Container className='Project-Top-Panel'>
            </Container>
        </Container>
        <Container className='Project-Bottom-Bar'>
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
