import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import {BsAirplaneEngines, BsAward} from "react-icons/bs";
import {GoBrowser,GoFileDirectory} from "react-icons/go";


import {useState} from 'react';
import { Container, Row, Col, Card, ProgressBar, Button, Image, Carousel} from 'react-bootstrap';
import { BsGithub, BsLinkedin, BsEnvelopeFill, BsArrowLeft } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

export default function PortfolioWebsite() {
  const navigate = useNavigate();
  return (
    <div className="page-split-bg text-light min-vh-100 d-flex flex-column justify-content-end">
        <header className='header-area-norm'>
            <Container fluid className='welcome-header d-flex align-items-center gap-2 p-0'>
            <button type="button" className="back-link" aria-label="Go back" onClick={() => navigate(-1)}>
                <BsArrowLeft />
            </button>
            <h1 className="display-5 mb-1" style={{ margin: 0 }}>Portfolio Website</h1>
            </Container>
        </header>
        <Container className='Project-Top-Bar'>
        </Container>
        <Container className='Project-Bottom-Bar'>
        </Container>
    </div>);
}
