import React, { useState } from 'react';
import AnimatedCounter from '../components/AnimatedCounter';
import SkeletonLoader from '../components/SkeletonLoader';
import ConfettiEffect from '../components/ConfettiEffect';
import ProgressBar from '../components/ProgressBar';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Tooltip from '../components/Tooltip';
import animations from '../utils/animations';
import haptics from '../utils/haptics';
import './ComponentShowcase.css';

/**
 * Component Showcase - Examples of all professional components
 * This file demonstrates how to use each component
 */
const ComponentShowcase = () => {
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [counter, setCounter] = useState(1000);
  const [progress, setProgress] = useState(65);

  const handleCelebrate = () => {
    setShowConfetti(true);
    haptics.success();
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleIncrement = () => {
    setCounter(prev => prev + 100);
    haptics.light();
  };

  const handleProgress = () => {
    setProgress(prev => (prev + 10) % 100);
  };

  return (
    <div className="showcase-container">
      <h1>Professional Components Showcase</h1>

      {/* Buttons Section */}
      <section className="showcase-section">
        <h2>Buttons</h2>
        <div className="showcase-grid">
          <Button variant="primary" icon="🚀">Primary Button</Button>
          <Button variant="secondary" icon="📝">Secondary Button</Button>
          <Button variant="success" icon="✓">Success Button</Button>
          <Button variant="danger" icon="✗">Danger Button</Button>
          <Button variant="warning" icon="⚠️">Warning Button</Button>
          <Button variant="outline" icon="👁️">Outline Button</Button>
          <Button variant="ghost" icon="👻">Ghost Button</Button>
          <Button variant="primary" loading>Loading...</Button>
        </div>
      </section>

      {/* Badges Section */}
      <section className="showcase-section">
        <h2>Badges</h2>
        <div className="showcase-grid">
          <Badge variant="primary" icon="⭐">VIP Gold</Badge>
          <Badge variant="success" icon="✓">Active</Badge>
          <Badge variant="warning" icon="⚠️">Pending</Badge>
          <Badge variant="danger" icon="✗">Expired</Badge>
          <Badge variant="info" icon="ℹ️">Info</Badge>
          <Badge variant="primary" pulse glow>New!</Badge>
        </div>
      </section>

      {/* Cards Section */}
      <section className="showcase-section">
        <h2>Cards</h2>
        <div className="showcase-grid">
          <Card hover padding="medium" shadow="medium">
            <h3>Hover Card</h3>
            <p>Hover over me to see the effect!</p>
          </Card>
          <Card padding="large" shadow="large">
            <h3>Large Card</h3>
            <p>With large padding and shadow</p>
          </Card>
          <Card hover padding="medium" shadow="medium" onClick={() => alert('Clicked!')}>
            <h3>Clickable Card</h3>
            <p>Click me!</p>
          </Card>
        </div>
      </section>

      {/* Animated Counter Section */}
      <section className="showcase-section">
        <h2>Animated Counter</h2>
        <Card padding="large">
          <div className="counter-demo">
            <AnimatedCounter 
              value={counter} 
              duration={1000}
              prefix="$"
              suffix=" pts"
              className="large-counter"
            />
            <Button variant="primary" onClick={handleIncrement}>
              Add 100 Points
            </Button>
          </div>
        </Card>
      </section>

      {/* Progress Bar Section */}
      <section className="showcase-section">
        <h2>Progress Bars</h2>
        <Card padding="large">
          <ProgressBar 
            current={progress} 
            max={100}
            label="Level Progress"
            color="primary"
            animated
          />
          <br />
          <ProgressBar 
            current={85} 
            max={100}
            label="XP Progress"
            color="success"
            animated
          />
          <br />
          <ProgressBar 
            current={45} 
            max={100}
            label="Daily Tasks"
            color="warning"
            animated
          />
          <br />
          <Button variant="primary" onClick={handleProgress}>
            Update Progress
          </Button>
        </Card>
      </section>

      {/* Tooltips Section */}
      <section className="showcase-section">
        <h2>Tooltips</h2>
        <div className="showcase-grid">
          <Tooltip content="This is a top tooltip" position="top">
            <Button variant="primary">Hover Top</Button>
          </Tooltip>
          <Tooltip content="This is a bottom tooltip" position="bottom">
            <Button variant="secondary">Hover Bottom</Button>
          </Tooltip>
          <Tooltip content="This is a left tooltip" position="left">
            <Button variant="success">Hover Left</Button>
          </Tooltip>
          <Tooltip content="This is a right tooltip" position="right">
            <Button variant="warning">Hover Right</Button>
          </Tooltip>
        </div>
      </section>

      {/* Skeleton Loaders Section */}
      <section className="showcase-section">
        <h2>Skeleton Loaders</h2>
        <Button 
          variant="primary" 
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 3000);
          }}
        >
          Toggle Loading
        </Button>
        <br /><br />
        {loading ? (
          <SkeletonLoader type="game" count={3} />
        ) : (
          <div className="showcase-grid">
            <Card padding="medium">
              <h3>🎮 Game 1</h3>
              <p>Play and earn points!</p>
            </Card>
            <Card padding="medium">
              <h3>🎯 Game 2</h3>
              <p>Complete challenges!</p>
            </Card>
            <Card padding="medium">
              <h3>🎲 Game 3</h3>
              <p>Win rewards!</p>
            </Card>
          </div>
        )}
      </section>

      {/* Confetti Section */}
      <section className="showcase-section">
        <h2>Confetti Effect</h2>
        <Card padding="large">
          <Button 
            variant="success" 
            size="large"
            icon="🎉"
            onClick={handleCelebrate}
          >
            Celebrate!
          </Button>
        </Card>
      </section>

      {/* Animations Section */}
      <section className="showcase-section">
        <h2>Animation Utilities</h2>
        <div className="showcase-grid">
          <Button 
            variant="primary"
            onClick={(e) => animations.shake(e.target)}
          >
            Shake Animation
          </Button>
          <Button 
            variant="success"
            onClick={(e) => animations.bounce(e.target)}
          >
            Bounce Animation
          </Button>
          <Button 
            variant="warning"
            onClick={(e) => animations.pulse(e.target)}
          >
            Pulse Animation
          </Button>
          <Button 
            variant="info"
            onClick={() => animations.confetti()}
          >
            Trigger Confetti
          </Button>
        </div>
      </section>

      {/* Confetti Effect Component */}
      <ConfettiEffect active={showConfetti} />
    </div>
  );
};

export default ComponentShowcase;
