/**
 * Дія - Main Application Core
 * Modular architecture with proper dependency management
 */

class DiaApp {
  constructor() {
    this.isReady = false;
    this.modules = {};
    this.config = {
      animationLibrary: 'gsap', // GSAP only, no anime.js duplication
      enableDebug: localStorage.getItem('DEBUG_MODE') === 'true',
      storagePrefix: 'dia_',
      imageCompressionQuality: 0.7,
      imageMaxWidth: 800,
      imageMaxHeight: 600
    };
    
    this.init();
  }

  /**
   * Initialize application in order
   */
  async init() {
    try {
      // Load splash screen first
      await this.loadModule('splash');
      
      // Verify critical dependencies
      this.verifyDependencies();
      
      // Initialize core systems in parallel
      await Promise.all([
        this.loadModule('storage'),
        this.loadModule('security'),
        this.loadModule('analytics')
      ]);
      
      // Wait for DOM
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
      }
      
      // Initialize UI modules
      await Promise.all([
        this.loadModule('modals'),
        this.loadModule('cards'),
        this.loadModule('qr'),
        this.loadModule('ai'),
        this.loadModule('animations'),
        this.loadModule('admin')
      ]);
      
      // Setup event delegation and cleanup
      this.setupEventCleanup();
      
      this.isReady = true;
      this.log('✓ App initialized successfully');
      this.emit('app:ready');
    } catch (error) {
      this.error('Initialization failed:', error);
      this.showFatalError();
    }
  }

  /**
   * Load and initialize a module
   */
  async loadModule(name) {
    if (this.modules[name]) return this.modules[name];
    
    try {
      const moduleClass = window[`${name.charAt(0).toUpperCase()}${name.slice(1)}Module`];
      if (!moduleClass) {
        throw new Error(`Module ${name} not found`);
      }
      
      const module = new moduleClass(this);
      await module.init?.();
      
      this.modules[name] = module;
      this.log(`Module loaded: ${name}`);
      return module;
    } catch (error) {
      this.warn(`Failed to load module ${name}:`, error);
      return null;
    }
  }

  /**
   * Verify critical browser APIs
   */
  verifyDependencies() {
    const required = [
      { name: 'gsap', check: () => typeof window.gsap !== 'undefined' },
      { name: 'jQuery', check: () => typeof $ !== 'undefined' },
      { name: 'Swiper', check: () => typeof Swiper !== 'undefined' },
      { name: 'localStorage', check: () => typeof localStorage !== 'undefined' }
    ];
    
    const missing = required.filter(dep => !dep.check());
    if (missing.length > 0) {
      throw new Error(`Missing dependencies: ${missing.map(d => d.name).join(', ')}`);
    }
  }

  /**
   * Setup automatic event listener cleanup on tab switch/close
   */
  setupEventCleanup() {
    const cleanup = () => {
      this.log('Cleaning up listeners and timers');
      // Clear all module listeners
      Object.values(this.modules).forEach(module => {
        module.cleanup?.();
      });
    };
    
    // Cleanup before unload
    window.addEventListener('beforeunload', cleanup);
    
    // Cleanup on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.log('App hidden - pausing animations');
        this.pauseAllAnimations();
      } else {
        this.log('App visible - resuming');
        this.resumeAllAnimations();
      }
    });
  }

  /**
   * Pause all GSAP animations
   */
  pauseAllAnimations() {
    if (window.gsap) {
      gsap.globalTimeline.pause();
    }
  }

  /**
   * Resume all GSAP animations
   */
  resumeAllAnimations() {
    if (window.gsap) {
      gsap.globalTimeline.resume();
    }
  }

  /**
   * Event emitter for cross-module communication
   */
  emit(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(event);
  }

  /**
   * Event listener with automatic cleanup
   */
  on(eventName, handler) {
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }

  /**
   * Logging utilities
   */
  log(...args) {
    if (this.config.enableDebug) {
      console.log('[Дія]', ...args);
    }
  }

  warn(...args) {
    console.warn('[Дія]', ...args);
  }

  error(...args) {
    console.error('[Дія]', ...args);
  }

  /**
   * Show fatal error to user
   */
  showFatalError() {
    const splash = document.querySelector('.loadpage');
    if (splash) {
      splash.innerHTML = `
        <div style="text-align: center; color: #fff; font-family: sans-serif;">
          <h2>Помилка завантаження</h2>
          <p>Будь ласка, оновіть сторінку</p>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px;">Перезавантажити</button>
        </div>
      `;
    }
  }
}

// Initialize on script load
window.diaApp = new DiaApp();
