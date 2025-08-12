import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import {useState} from 'react';
import { Container, Row, Col, Card, ProgressBar, Button, Image, Carousel} from 'react-bootstrap';
import { BsGithub, BsLinkedin, BsEnvelopeFill } from 'react-icons/bs';

const cardData = [
  {
    title: 'Projects',
    text: 'Under Construction',
    img: 'https://via.placeholder.com/100x160',
    link: '/first'
  },
  {
    title: 'Skills',
    text: 'Under Construction',
    img: 'https://via.placeholder.com/100x160',
    link: '/second'
  },
  {
    title: 'Experience',
    text: 'Under Construction',
    img: 'https://via.placeholder.com/100x160',
    link: '/third'
  },
  {
    title: 'About',
    text: 'Under Construction',
    img: 'https://via.placeholder.com/100x160',
    link: '/fourth'
  }
];

const progressCards = [
  { title: 'Build Status', now: 25, variant: 'info', link: '/status' },
  { title: 'Deployment', now: 25, variant: 'warning', link: '/deploy' },
];

const slides = [
  {
    src: 'Paul-Profile.jpg',
    title: 'First slide label',
    text: 'Nulla vitae elit libero, a pharetra augue mollis interdum.',
    alt: 'First slide'
  },
  {
    src: '/Paul-Profile.jpg',
    title: 'Second slide label',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    alt: 'Second slide'
  },
  {
    src: '/Paul-Profile.jpg',
    title: 'Third slide label',
    text: 'Praesent commodo cursus magna, vel scelerisque nisl consectetur.',
    alt: 'Third slide'
  }
  ];

function App() {
  const [index, setIndex] = useState(0);
  const handleSelect = (selectedIndex) => setIndex(selectedIndex);
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

      <Container fluid className='p-0' style={{ height:'50vh', width:'70vw'}}>
        <Row sm={1} md={2} lg={2} className="g-4 h-100">
          {cardData.map((card, idx) => (
            <Col key={idx} className="d-flex">
              <Card
                as="a"
                href={card.link}
                bg="dark"
                text="light"
                className="flex-fill hover-card"
              >
                {/* <Card.Img variant="left" src={card.img} style={{maxWidth: 100, maxHeight: 160}}/> */}
                <Card.ImgOverlay>
                  <Card.Title>{card.title}</Card.Title>
                  <Card.Text>{card.text}</Card.Text>
                </Card.ImgOverlay>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>);
}

export default App
