// Professional animation utilities

export const animations = {
  // Trigger confetti effect
  confetti: () => {
    const event = new CustomEvent('trigger-confetti');
    window.dispatchEvent(event);
  },

  // Shake element (for errors)
  shake: (element) => {
    if (!element) return;
    element.classList.add('shake-animation');
    setTimeout(() => element.classList.remove('shake-animation'), 500);
  },

  // Bounce element (for success)
  bounce: (element) => {
    if (!element) return;
    element.classList.add('bounce-animation');
    setTimeout(() => element.classList.remove('bounce-animation'), 600);
  },

  // Pulse element (for attention)
  pulse: (element) => {
    if (!element) return;
    element.classList.add('pulse-animation');
    setTimeout(() => element.classList.remove('pulse-animation'), 1000);
  },

  // Fade in element
  fadeIn: (element, duration = 300) => {
    if (!element) return;
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    setTimeout(() => {
      element.style.opacity = '1';
    }, 10);
  },

  // Slide in from bottom
  slideInUp: (element, duration = 400) => {
    if (!element) return;
    element.style.transform = 'translateY(20px)';
    element.style.opacity = '0';
    element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    setTimeout(() => {
      element.style.transform = 'translateY(0)';
      element.style.opacity = '1';
    }, 10);
  },

  // Scale in
  scaleIn: (element, duration = 300) => {
    if (!element) return;
    element.style.transform = 'scale(0.9)';
    element.style.opacity = '0';
    element.style.transition = `all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
    setTimeout(() => {
      element.style.transform = 'scale(1)';
      element.style.opacity = '1';
    }, 10);
  }
};

export default animations;
