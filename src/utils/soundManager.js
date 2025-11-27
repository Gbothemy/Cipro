// Sound Manager for Cipro
// Uses Web Audio API to generate game sounds

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.3;
    this.init();
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  // Play a beep sound with specific frequency and duration
  playTone(frequency, duration, type = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }

  // Game sounds
  click() {
    this.playTone(800, 0.1, 'square');
  }

  success() {
    this.playTone(523.25, 0.1, 'sine'); // C5
    setTimeout(() => this.playTone(659.25, 0.1, 'sine'), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.2, 'sine'), 200); // G5
  }

  error() {
    this.playTone(200, 0.1, 'sawtooth');
    setTimeout(() => this.playTone(150, 0.2, 'sawtooth'), 100);
  }

  correct() {
    this.playTone(880, 0.15, 'sine'); // A5
    setTimeout(() => this.playTone(1046.5, 0.15, 'sine'), 150); // C6
  }

  wrong() {
    this.playTone(300, 0.2, 'triangle');
  }

  coin() {
    this.playTone(987.77, 0.05, 'square'); // B5
    setTimeout(() => this.playTone(1318.51, 0.1, 'square'), 50); // E6
  }

  levelUp() {
    this.playTone(523.25, 0.1, 'sine'); // C5
    setTimeout(() => this.playTone(659.25, 0.1, 'sine'), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.1, 'sine'), 200); // G5
    setTimeout(() => this.playTone(1046.5, 0.3, 'sine'), 300); // C6
  }

  gameStart() {
    this.playTone(440, 0.1, 'sine'); // A4
    setTimeout(() => this.playTone(554.37, 0.1, 'sine'), 100); // C#5
    setTimeout(() => this.playTone(659.25, 0.15, 'sine'), 200); // E5
  }

  gameOver() {
    this.playTone(659.25, 0.15, 'sine'); // E5
    setTimeout(() => this.playTone(554.37, 0.15, 'sine'), 150); // C#5
    setTimeout(() => this.playTone(440, 0.15, 'sine'), 300); // A4
    setTimeout(() => this.playTone(349.23, 0.3, 'sine'), 450); // F4
  }

  spin() {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        this.playTone(200 + i * 50, 0.05, 'square');
      }, i * 50);
    }
  }

  match() {
    this.playTone(1046.5, 0.1, 'sine'); // C6
    setTimeout(() => this.playTone(1318.51, 0.15, 'sine'), 100); // E6
  }

  flip() {
    this.playTone(600, 0.05, 'sine');
  }

  tick() {
    this.playTone(1000, 0.03, 'square');
  }

  warning() {
    this.playTone(400, 0.1, 'triangle');
    setTimeout(() => this.playTone(400, 0.1, 'triangle'), 200);
  }

  // Volume control
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // Enable/disable sounds
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // Toggle sound
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// Create singleton instance
const soundManager = new SoundManager();

export default soundManager;
