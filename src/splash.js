/**
 * Splash Screen Module
 * Handles initial logo/loading animation
 */

class SplashModule {
  constructor(app) {
    this.app = app;
    this.splashEl = null;
    this.videoEl = null;
    this.hideTimeout = null;
  }

  async init() {
    this.splashEl = document.querySelector('.loadpage');
    this.videoEl = this.splashEl?.querySelector('.loadpage-video');
    
    // Auto-hide splash after video ends or 5 seconds max
    if (this.videoEl) {
      this.videoEl.addEventListener('ended', () => this.hide(), { once: true });
    }
    
    this.hideTimeout = setTimeout(() => this.hide(), 5000);
  }

  hide() {
    if (!this.splashEl) return;
    
    clearTimeout(this.hideTimeout);
    
    this.splashEl.classList.add('fade-out');
    setTimeout(() => {
      this.splashEl.classList.add('hidden');
    }, 450);
  }

  cleanup() {
    clearTimeout(this.hideTimeout);
  }
}

// Register module
window.SplashModule = SplashModule;
