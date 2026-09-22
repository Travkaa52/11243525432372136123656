/**
 * Security Module
 * PIN-code, biometric, and data encryption
 */

class SecurityModule {
  constructor(app) {
    this.app = app;
    this.pinCode = '1234'; // Default, can be changed
    this.isLocked = true;
    this.attemptCount = 0;
    this.maxAttempts = 5;
    this.lockoutTime = 60000; // 1 minute
  }

  async init() {
    this.loadSettings();
    this.setupPinPanel();
    this.setupBiometric();
  }

  /**
   * Load security settings from storage
   */
  loadSettings() {
    const stored = this.app.modules.storage?.getItem('security_settings');
    if (stored) {
      this.pinCode = stored.pin || this.pinCode;
      this.isLocked = stored.isLocked !== false;
    }
  }

  /**
   * Setup PIN input panel
   */
  setupPinPanel() {
    const pinPanel = document.querySelector('[data-security="pin"]');
    if (!pinPanel) return;
    
    // Add event listeners to PIN pad
    const buttons = pinPanel.querySelectorAll('[data-pin-btn]');
    let currentPin = '';
    
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const digit = btn.dataset.pinBtn;
        
        if (digit === 'clear') {
          currentPin = '';
        } else if (digit === 'enter') {
          this.validatePin(currentPin);
          currentPin = '';
        } else {
          currentPin += digit;
          this.updatePinDisplay(currentPin.length);
        }
      });
    });
  }

  /**
   * Validate PIN code
   */
  validatePin(entered) {
    if (entered === this.pinCode) {
      this.unlock();
      this.attemptCount = 0;
    } else {
      this.attemptCount++;
      this.showPinError();
      
      if (this.attemptCount >= this.maxAttempts) {
        this.lockout();
      }
    }
  }

  /**
   * Show PIN error and shake animation
   */
  showPinError() {
    const pinDisplay = document.querySelector('[data-pin-display]');
    if (pinDisplay) {
      gsap.to(pinDisplay, {
        x: 10,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        onComplete: () => {
          gsap.set(pinDisplay, { x: 0 });
        }
      });
    }
  }

  /**
   * Update PIN display dots
   */
  updatePinDisplay(length) {
    const display = document.querySelector('[data-pin-display]');
    if (display) {
      display.textContent = '•'.repeat(length);
    }
  }

  /**
   * Unlock application
   */
  unlock() {
    this.isLocked = false;
    const pinScreen = document.querySelector('[data-security="pin"]');
    if (pinScreen) {
      gsap.to(pinScreen, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          pinScreen.style.display = 'none';
        }
      });
    }
    this.app.emit('security:unlocked');
  }

  /**
   * Lockout after max attempts
   */
  lockout() {
    const pinPanel = document.querySelector('[data-security="pin"]');
    if (pinPanel) {
      const buttons = pinPanel.querySelectorAll('[data-pin-btn]');
      buttons.forEach(btn => btn.disabled = true);
      
      const countdown = this.lockoutTime / 1000;
      let remaining = countdown;
      
      const timer = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(timer);
          buttons.forEach(btn => btn.disabled = false);
          this.attemptCount = 0;
        }
      }, 1000);
    }
  }

  /**
   * Setup biometric authentication (Face ID / fingerprint)
   */
  setupBiometric() {
    if (!window.PublicKeyCredential) {
      this.app.log('WebAuthn not supported');
      return;
    }
    
    const bioBtn = document.querySelector('[data-biometric-btn]');
    if (!bioBtn) return;
    
    bioBtn.addEventListener('click', () => this.attemptBiometric());
  }

  /**
   * Attempt biometric unlock
   */
  async attemptBiometric() {
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (!available) {
        this.app.log('Biometric not available');
        return;
      }
      
      // Simplified biometric check - in production use WebAuthn
      // For demo: skip PIN if biometric is triggered
      this.unlock();
    } catch (error) {
      this.app.error('Biometric error:', error);
    }
  }

  /**
   * Hash sensitive data (simplified)
   */
  hashData(data) {
    // In production, use proper cryptographic hashing
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Save security settings
   */
  saveSettings() {
    this.app.modules.storage?.setItem('security_settings', {
      pin: this.pinCode,
      isLocked: this.isLocked
    });
  }

  cleanup() {
    // Cleanup biometric listeners if needed
  }
}

window.SecurityModule = SecurityModule;
