import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import {BsAirplaneEngines, BsAward} from "react-icons/bs";
import {GoBrowser,GoFileDirectory} from "react-icons/go";


import {useState} from 'react';
import { Container, Row, Col, Card, ProgressBar, Button, Image, Carousel} from 'react-bootstrap';
import { BsGithub, BsLinkedin, BsEnvelopeFill } from 'react-icons/bs';

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
];

export default function Projects() {
  return (
    <div className="page-split-norm text-light min-vh-100 d-flex flex-column justify-content-end">
        <header className='header-area-norm'>
            <h1>Projects</h1>
        </header>

        <Container className='project-cards'>
            <Row xs={3} sm={3} md={3} lg={3} className="g-4 h-100">
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
