# 🚀 Quick Component Reference Guide

## Import Statements

```javascript
// Components
import Button from './components/Button';
import Card from './components/Card';
import Badge from './components/Badge';
import Tooltip from './components/Tooltip';
import AnimatedCounter from './components/AnimatedCounter';
import ProgressBar from './components/ProgressBar';
import SkeletonLoader from './components/SkeletonLoader';
import ConfettiEffect from './components/ConfettiEffect';

// Utilities
import haptics from './utils/haptics';
import animations from './utils/animations';
```

---

## 🔘 Button

```javascript
<Button 
  variant="primary"      // primary | secondary | success | danger | warning | outline | ghost
  size="medium"          // small | medium | large
  icon="🚀"
  iconPosition="left"    // left | right
  loading={false}
  disabled={false}
  fullWidth={false}
  ripple={true}
  onClick={handleClick}
>
  Button Text
</Button>
```

---

## 🎴 Card

```javascript
<Card 
  hover={true}
  padding="medium"       // none | small | medium | large
  shadow="medium"        // none | small | medium | large
  onClick={handleClick}
>
  Card Content
</Card>
```

---

## 🏷️ Badge

```javascript
<Badge 
  variant="success"      // primary | success | warning | danger | info | secondary
  size="medium"          // small | medium | large
  icon="⭐"
  pulse={false}
  glow={false}
>
  Badge Text
</Badge>
```

---

## 💬 Tooltip

```javascript
<Tooltip 
  content="Tooltip text"
  position="top"         // top | bottom | left | right
  delay={200}
>
  <button>Hover me</button>
</Tooltip>
```

---

## 🔢 AnimatedCounter

```javascript
<AnimatedCounter 
  value={1500}
  duration={1000}
  prefix="$"
  suffix=" pts"
  decimals={0}
  className="custom-class"
/>
```

---

## 📊 ProgressBar

```javascript
<ProgressBar 
  current={75}
  max={100}
  label="Progress"
  color="success"        // primary | success | warning | danger
  size="medium"          // small | medium | large
  animated={true}
  showPercentage={true}
/>
```

---

## 💀 SkeletonLoader

```javascript
<SkeletonLoader 
  type="game"            // card | text | title | avatar | button | game
  count={3}
/>
```

---

## 🎉 ConfettiEffect

```javascript
const [showConfetti, setShowConfetti] = useState(false);

<ConfettiEffect 
  active={showConfetti}
  duration={3000}
/>
```

---

## 📳 Haptics

```javascript
haptics.light();       // Light tap
haptics.medium();      // Medium impact
haptics.heavy();       // Heavy impact
haptics.success();     // Success pattern
haptics.error();       // Error pattern
haptics.warning();     // Warning pattern
haptics.toggle();      // Toggle on/off
```

---

## ✨ Animations

```javascript
animations.confetti();           // Trigger confetti
animations.shake(element);       // Shake animation
animations.bounce(element);      // Bounce animation
animations.pulse(element);       // Pulse animation
animations.fadeIn(element);      // Fade in
animations.slideInUp(element);   // Slide up
animations.scaleIn(element);     // Scale in
```

---

## 🎨 CSS Classes

```css
.shake-animation       /* Shake effect */
.bounce-animation      /* Bounce effect */
.pulse-animation       /* Pulse effect */
.fade-in-animation     /* Fade in */
.slide-up-animation    /* Slide up */
.scale-in-animation    /* Scale in */
.gradient-animated     /* Animated gradient */
.card-hover            /* Card hover */
.ripple                /* Ripple effect */
```

---

## 🎯 Common Patterns

### Loading State
```javascript
{loading ? (
  <SkeletonLoader type="game" count={3} />
) : (
  <GameList />
)}
```

### Success with Confetti
```javascript
const handleSuccess = () => {
  setShowConfetti(true);
  haptics.success();
  toast.success('Success!');
  setTimeout(() => setShowConfetti(false), 3000);
};
```

### Animated Stats
```javascript
<Card padding="large">
  <AnimatedCounter 
    value={userPoints} 
    prefix="Points: "
    duration={1000}
  />
  <ProgressBar 
    current={userXP} 
    max={nextLevelXP}
    label="Level Progress"
    animated
  />
</Card>
```

### Interactive Button
```javascript
<Tooltip content="Click to play" position="top">
  <Button 
    variant="primary"
    icon="🎮"
    onClick={() => {
      haptics.light();
      handlePlay();
    }}
  >
    Play Game
  </Button>
</Tooltip>
```

---

## 📱 Mobile Best Practices

1. **Always use haptic feedback** for button clicks
2. **Show loading states** with skeleton loaders
3. **Animate numbers** with AnimatedCounter
4. **Use tooltips** for helpful hints
5. **Celebrate achievements** with confetti
6. **Show progress** with ProgressBar

---

## 🎨 Color Variants

- **primary** - Purple gradient (#667eea → #764ba2)
- **success** - Green gradient (#48bb78 → #38a169)
- **warning** - Orange gradient (#ed8936 → #dd6b20)
- **danger** - Red gradient (#f56565 → #e53e3e)
- **info** - Blue gradient (#4299e1 → #3182ce)
- **secondary** - Gray (#e2e8f0)

---

## 🚀 Quick Start Example

```javascript
import React, { useState } from 'react';
import Button from './components/Button';
import Card from './components/Card';
import Badge from './components/Badge';
import AnimatedCounter from './components/AnimatedCounter';
import ConfettiEffect from './components/ConfettiEffect';
import haptics from './utils/haptics';

function MyComponent() {
  const [points, setPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleEarn = () => {
    setPoints(prev => prev + 100);
    haptics.success();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <>
      <Card hover padding="large">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Earn Points</h2>
          <Badge variant="success" pulse>Active</Badge>
        </div>
        
        <AnimatedCounter 
          value={points} 
          prefix="Points: "
          duration={800}
        />
        
        <Button 
          variant="primary"
          size="large"
          icon="🎮"
          fullWidth
          onClick={handleEarn}
        >
          Earn 100 Points
        </Button>
      </Card>
      
      <ConfettiEffect active={showConfetti} />
    </>
  );
}
```

---

## 📚 Full Documentation

- **Component Showcase**: `src/examples/ComponentShowcase.js`
- **Enhancement Guide**: `PROFESSIONAL-ENHANCEMENTS-COMPLETE.md`
- **Enterprise Guide**: `ENTERPRISE-LEVEL-COMPLETE.md`
- **This Reference**: `QUICK-COMPONENT-REFERENCE.md`

---

**Happy Coding! 🚀**
