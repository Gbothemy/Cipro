// Haptic feedback for mobile devices

class HapticsManager {
  constructor() {
    this.enabled = true;
    this.isSupported = 'vibrate' in navigator;
  }

  // Light tap feedback
  light() {
    if (this.enabled && this.isSupported) {
      navigator.vibrate(10);
    }
  }

  // Medium impact feedback
  medium() {
    if (this.enabled && this.isSupported) {
      navigator.vibrate(20);
    }
  }

  // Heavy impact feedback
  heavy() {
    if (this.enabled && this.isSupported) {
      navigator.vibrate(30);
    }
  }

  // Success pattern
  success() {
    if (this.enabled && this.isSupported) {
      navigator.vibrate([10, 50, 10]);
    }
  }

  // Error pattern
  error() {
    if (this.enabled && this.isSupported) {
      navigator.vibrate([20, 50, 20, 50, 20]);
    }
  }

  // Warning pattern
  warning() {
    if (this.enabled && this.isSupported) {
      navigator.vibrate([15, 30, 15]);
    }
  }

  // Toggle haptics on/off
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('haptics_enabled', this.enabled);
    return this.enabled;
  }

  // Check if enabled
  isEnabled() {
    return this.enabled && this.isSupported;
  }
}

const haptics = new HapticsManager();
export default haptics;
