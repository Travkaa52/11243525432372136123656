/**
 * QR Module
 * Handles QR/barcode display, rotation, and refresh
 */

class QrModule {
  constructor(app) {
    this.app = app;
    this.qrRefreshInterval = null;
    this.rotationDuration = 100;
    this.refreshRate = 30000; // 30 seconds - optimized from shorter intervals
    this.listeners = [];
    this.activeQr = null;
  }

  async init() {
    this.setupQrToggle();
    this.startQrRefresh();
  }

  /**
   * Setup QR code flip buttons
   */
  setupQrToggle() {
    const qrButtons = document.querySelectorAll('[data-qr-toggle]');
    
    qrButtons.forEach(btn => {
      const handler = (e) => {
        e.preventDefault();
        const qrType = btn.dataset.qrToggle;
        this.toggleQr(qrType);
      };
      
      btn.addEventListener('click', handler);
      this.listeners.push({ el: btn, event: 'click', handler });
    });
  }

  /**
   * Toggle QR code with smooth rotation
   */
  toggleQr(type) {
    const qrContainer = document.querySelector(`[data-qr-type="${type}"]`);
    if (!qrContainer) return;
    
    // Use GSAP for rotation instead of anime.js
    gsap.to(qrContainer, {
      rotateY: '+=180',
      duration: this.rotationDuration / 1000,
      ease: 'power1.inOut'
    });
    
    this.updateQrVisuals(qrContainer);
    this.activeQr = qrContainer;
  }

  /**
   * Update QR visual styling after flip
   */
  updateQrVisuals(container) {
    const tabs = container.querySelectorAll('[data-qr-tab]');
    
    tabs.forEach((tab, index) => {
      const isActive = tab.classList.contains('active');
      
      if (isActive) {
        tab.classList.remove('active');
      } else {
        tab.classList.add('active');
      }
      
      // Update background based on active state
      const bgColor = tab.classList.contains('active') ? '#000' : '#ddd';
      const filter = tab.classList.contains('active') ? 'brightness(0) invert(1)' : 'brightness(1) invert(0)';
      
      tab.style.background = bgColor;
      const img = tab.querySelector('img');
      if (img) {
        img.style.filter = filter;
      }
    });
  }

  /**
   * Start optimized QR refresh timer
   * Only refresh when tab is visible
   */
  startQrRefresh() {
    // Stop existing timer
    if (this.qrRefreshInterval) {
      clearInterval(this.qrRefreshInterval);
    }
    
    // Only start timer if document is visible
    const startRefresh = () => {
      if (!document.hidden) {
        this.qrRefreshInterval = setInterval(() => {
          if (!document.hidden) {
            this.refreshQrCodes();
          }
        }, this.refreshRate);
      }
    };
    
    startRefresh();
    
    // Pause/resume on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.qrRefreshInterval) {
          clearInterval(this.qrRefreshInterval);
          this.qrRefreshInterval = null;
        }
      } else {
        startRefresh();
      }
    });
  }

  /**
   * Refresh QR codes (update image/code if needed)
   * This is lightweight - just re-fetch current codes
   */
  refreshQrCodes() {
    const qrElements = document.querySelectorAll('[data-qr-type]');
    
    qrElements.forEach(qr => {
      const qrCode = qr.querySelector('[data-qr-code]');
      if (qrCode) {
        // Regenerate or fetch fresh QR code
        this.updateQrCode(qrCode);
      }
    });
    
    this.app.log('QR codes refreshed');
  }

  /**
   * Update individual QR code
   */
  updateQrCode(codeEl) {
    // Implementation depends on how QR codes are generated
    // This could be a simple re-render or API call
    if (codeEl && codeEl.textContent) {
      // Regenerate QR (example)
      const data = codeEl.textContent;
      // Re-encode with current timestamp to make unique
      const timestamp = Date.now();
      // Update visual representation
      codeEl.dataset.updated = timestamp;
    }
  }

  /**
   * Change QR refresh rate dynamically
   */
  setRefreshRate(milliseconds) {
    this.refreshRate = milliseconds;
    if (this.qrRefreshInterval) {
      clearInterval(this.qrRefreshInterval);
      this.startQrRefresh();
    }
  }

  cleanup() {
    // Clear refresh interval
    if (this.qrRefreshInterval) {
      clearInterval(this.qrRefreshInterval);
      this.qrRefreshInterval = null;
    }
    
    // Remove event listeners
    this.listeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}

window.QrModule = QrModule;
