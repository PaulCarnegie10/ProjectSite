import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';


import {useState} from 'react';
import { Container, Row, Col, Card, ProgressBar, Button, Image, Carousel} from 'react-bootstrap';
import { BsGithub, BsLinkedin, BsEnvelopeFill, BsArrowLeft } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="page-split-norm text-light min-vh-100 d-flex flex-column justify-content-end">
        <header className='header-area-norm'>
            <button type="button" className="back-link" aria-label="Go back" onClick={() => navigate(-1)}>
              <BsArrowLeft />
            </button>
            <h1>About</h1>
        </header>
    </div>);
}
