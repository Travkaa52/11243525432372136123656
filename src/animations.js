/**
 * Animations Module
 * Centralized GSAP animation management (no anime.js duplication)
 */

class AnimationsModule {
  constructor(app) {
    this.app = app;
    this.gsap = window.gsap;
  }

  async init() {
    if (!this.gsap) {
      this.app.warn('GSAP not available');
      return;
    }
    
    this.setupPageTransitions();
    this.setupScrollAnimations();
    this.setupTextAnimations();
  }

  /**
   * Setup page entrance animations
   */
  setupPageTransitions() {
    const elementsToAnimate = document.querySelectorAll('[data-animate-in]');
    
    elementsToAnimate.forEach((el, index) => {
      const animationType = el.dataset.animateIn || 'fadeUp';
      const delay = (el.dataset.animateDelay || 0) * 0.1 + index * 0.05;
      
      this.animateElement(el, animationType, delay);
    });
  }

  /**
   * Generic element animation
   */
  animateElement(el, type, delay = 0) {
    const baseConfig = {
      delay,
      duration: 0.6,
      ease: 'power2.out'
    };
    
    switch (type) {
      case 'fadeUp':
        this.gsap.fromTo(el,
          { opacity: 0, y: 20 },
          { ...baseConfig, opacity: 1, y: 0 }
        );
        break;
        
      case 'fadeIn':
        this.gsap.fromTo(el,
          { opacity: 0 },
          { ...baseConfig, opacity: 1 }
        );
        break;
        
      case 'slideRight':
        this.gsap.fromTo(el,
          { opacity: 0, x: -20 },
          { ...baseConfig, opacity: 1, x: 0 }
        );
        break;
        
      case 'slideLeft':
        this.gsap.fromTo(el,
          { opacity: 0, x: 20 },
          { ...baseConfig, opacity: 1, x: 0 }
        );
        break;
        
      case 'scale':
        this.gsap.fromTo(el,
          { opacity: 0, scale: 0.9 },
          { ...baseConfig, opacity: 1, scale: 1 }
        );
        break;
    }
  }

  /**
   * Setup scroll-triggered animations
   */
  setupScrollAnimations() {
    if (!window.ScrollTrigger) {
      this.app.log('ScrollTrigger not available');
      return;
    }
    
    const scrollElements = document.querySelectorAll('[data-scroll-animate]');
    
    scrollElements.forEach(el => {
      this.gsap.registerPlugin(ScrollTrigger);
      
      this.gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          once: true
        },
        opacity: 1,
        y: 0,
        duration: 0.8
      });
    });
  }

  /**
   * Setup text animations (typing, stagger)
   */
  setupTextAnimations() {
    const textElements = document.querySelectorAll('[data-text-animate]');
    
    textElements.forEach(el => {
      const type = el.dataset.textAnimate || 'stagger';
      
      if (type === 'typing') {
        this.animateTextTyping(el);
      } else if (type === 'stagger') {
        this.animateTextStagger(el);
      }
    });
  }

  /**
   * Typing animation for text
   */
  animateTextTyping(el) {
    const text = el.textContent;
    el.textContent = '';
    
    this.gsap.to(el, {
      textContent: text,
      duration: text.length * 0.05,
      ease: 'none',
      modifiers: {
        textContent: gsap.utils.snap({ values: text.split(''), radius: 0 })
      }
    });
  }

  /**
   * Stagger animation for characters or words
   */
  animateTextStagger(el) {
    const chars = el.textContent.split('');
    el.innerHTML = chars.map(char => 
      `<span style="opacity: 0;" class="char">${char}</span>`
    ).join('');
    
    const charSpans = el.querySelectorAll('.char');
    
    this.gsap.to(charSpans, {
      opacity: 1,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power1.out'
    });
  }

  /**
   * Pulse animation for alerts/notifications
   */
  animatePulse(el, count = 3) {
    this.gsap.to(el, {
      scale: 1.05,
      duration: 0.3,
      repeat: count,
      yoyo: true
    });
  }

  /**
   * Shake animation for errors
   */
  animateShake(el, intensity = 5) {
    this.gsap.to(el, {
      x: intensity,
      duration: 0.1,
      repeat: 5,
      yoyo: true,
      ease: 'power1.inOut',
      onComplete: () => {
        this.gsap.set(el, { x: 0 });
      }
    });
  }

  /**
   * Bounce animation
   */
  animateBounce(el, height = 20) {
    this.gsap.to(el, {
      y: -height,
      duration: 0.3,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut'
    });
  }

  cleanup() {
    // GSAP animations are managed globally
    // Cleanup happens via app.pauseAllAnimations()
  }
}

window.AnimationsModule = AnimationsModule;
