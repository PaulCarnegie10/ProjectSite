import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import {BsAirplaneEngines, BsAward} from "react-icons/bs";
import {GoBrowser,GoFileDirectory} from "react-icons/go";


import {useState} from 'react';
import { Container, Row, Col, Card, ProgressBar, Button, Image, Carousel} from 'react-bootstrap';
import { BsGithub, BsLinkedin, BsEnvelopeFill, BsArrowLeft } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

const cardData = [
  {
    title: 'Terrain Mapper',
    text: 'Under Construction',
    img: 'https://via.placeholder.com/100x160',
    link: '/ProjectSite/projects',
    icon: BsAirplaneEngines
  },
  {
    title: 'APCSP AutoGrader',
    text: 'Under Construction',
    img: 'https://via.placeholder.com/100x160',
    link: '/ProjectSite/skills',
    icon: GoBrowser  
  },
  {
    title: 'Portfolio Website',
    text: 'Under Construction',
    img: 'https://via.placeholder.com/100x160',
    link: '/ProjectSite/experience',
    icon: GoFileDirectory
  },
    {
    title: 'Portfolio Website',
    text: 'Under Construction',
    img: 'https://via.placeholder.com/100x160',
    link: '/ProjectSite/experience',
    icon: GoFileDirectory
  },
    {
    title: 'Portfolio Website',
    text: 'Under Construction',
    img: 'https://via.placeholder.com/100x160',
    link: '/ProjectSite/experience',
    icon: GoFileDirectory
  },
];

export default function Skills() {
  const navigate = useNavigate();
  return (
    <div className="page-split-norm text-light min-vh-100 d-flex flex-column justify-content-end">
        <header className='header-area-norm'>
            <button type="button" className="back-link" aria-label="Go back" onClick={() => navigate(-1)}>
              <BsArrowLeft />
            </button>
            <h1>Skills</h1>
        </header>

        <Container className='project-cards'>
            <Row xs={5} sm={5} md={5} lg={5} className="g-4 h-100">
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
