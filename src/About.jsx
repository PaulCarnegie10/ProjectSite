import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';


import {useState} from 'react';
import { Container, Row, Col, Card, ProgressBar, Button, Image, Carousel} from 'react-bootstrap';
import { BsGithub, BsLinkedin, BsEnvelopeFill } from 'react-icons/bs';

export default function About() {
  return (
    <div className="page-split-norm text-light min-vh-100 d-flex flex-column justify-content-end">
        <header className='header-area-norm'>
            <h1>About</h1>
        </header>
    </div>);
}
