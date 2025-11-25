class SoundManager {
  constructor() {
    this.enabled = localStorage.getItem('soundEnabled') !== 'false';
    this.sounds = {};
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('soundEnabled', this.enabled);
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  // Play sound using Web Audio API or simple beep
  play(type) {
    if (!this.enabled) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different sounds for different actions
    const soundConfig = {
      click: { frequency: 800, duration: 0.1 },
      success: { frequency: 1000, duration: 0.2 },
      error: { frequency: 400, duration: 0.3 },
      levelUp: { frequency: 1200, duration: 0.4 },
      coin: { frequency: 900, duration: 0.15 }
    };

    const config = soundConfig[type] || soundConfig.click;

    oscillator.frequency.value = config.frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + config.duration);
  }
}

export default new SoundManager();
