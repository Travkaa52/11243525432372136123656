/**
 * Modals Module
 * Handles document cards, flip animations, and modal dialogs
 */

class ModalsModule {
  constructor(app) {
    this.app = app;
    this.cardState = new Map();
    this.activeModal = null;
    this.listeners = [];
  }

  async init() {
    this.setupCardFlip();
    this.setupModalsToggle();
    this.setupDocumentSwiper();
    this.setupNewsSwiper();
    this.setupActionButtons();
  }

  /**
   * Setup 3D card flip with GSAP
   */
  setupCardFlip() {
    const flipCards = document.querySelectorAll('[data-flip-card]');
    
    flipCards.forEach(card => {
      const state = {
        flipped: false,
        isAnimating: false
      };
      
      this.cardState.set(card, state);
      
      card.addEventListener('click', (e) => {
        if (state.isAnimating || e.target.closest('[data-no-flip]')) return;
        this.flipCard(card);
      }, { passive: false });
    });
  }

  /**
   * Flip card with 3D perspective
   */
  flipCard(card) {
    const state = this.cardState.get(card);
    if (!state || state.isAnimating) return;
    
    state.isAnimating = true;
    const newRotation = state.flipped ? 0 : 180;
    
    gsap.to(card, {
      rotateY: newRotation,
      duration: 0.6,
      ease: 'back.inOut',
      onComplete: () => {
        state.flipped = !state.flipped;
        state.isAnimating = false;
      }
    });
  }

  /**
   * Setup modal toggle buttons
   */
  setupModalsToggle() {
    const toggleButtons = document.querySelectorAll('[data-modal-toggle]');
    
    toggleButtons.forEach(btn => {
      const handler = (e) => {
        e.preventDefault();
        const modalTarget = btn.dataset.modalToggle;
        this.toggleModal(modalTarget);
      };
      
      btn.addEventListener('click', handler);
      this.listeners.push({ el: btn, event: 'click', handler });
    });
  }

  /**
   * Toggle modal visibility
   */
  toggleModal(selector) {
    const modal = document.querySelector(selector);
    if (!modal) return;
    
    const isVisible = !modal.classList.contains('hidden');
    
    if (isVisible) {
      this.closeModal(modal);
    } else {
      this.openModal(modal);
    }
  }

  /**
   * Open modal with animation
   */
  openModal(modal) {
    if (this.activeModal) this.closeModal(this.activeModal);
    
    this.activeModal = modal;
    modal.classList.remove('hidden');
    
    gsap.to(modal, {
      opacity: 1,
      duration: 0.3,
      pointerEvents: 'auto'
    });
  }

  /**
   * Close modal with animation
   */
  closeModal(modal) {
    gsap.to(modal, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        modal.classList.add('hidden');
      }
    });
    
    if (this.activeModal === modal) {
      this.activeModal = null;
    }
  }

  /**
   * Setup documents carousel with Swiper
   */
  setupDocumentSwiper() {
    const swiperEl = document.querySelector('.documentSlider');
    if (!swiperEl) return;
    
    const swiper = new Swiper(swiperEl, {
      slidesPerView: 1.1,
      centeredSlides: true,
      spaceBetween: 14,
      speed: 400,
      grabCursor: true,
      resistanceRatio: 0.85,
      touchRatio: 1.1,
      touchAngle: 45,
      touchReleaseOnEdges: true,
      watchSlidesProgress: true,
      preventClicks: true,
      preventClicksPropagation: true,
      
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true,
      },
      
      on: {
        slideChange: (swiper) => {
          // Reset flipped cards on slide change
          const slides = swiperEl.querySelectorAll('.slider');
          slides.forEach(slide => {
            const state = this.cardState.get(slide);
            if (state?.flipped) {
              this.flipCard(slide);
            }
          });
        },
        
        setTranslate: (swiper) => {
          swiper.slides.forEach(slide => {
            const progress = slide.progress;
            const scale = 1 - Math.min(Math.abs(progress) * 0.06, 0.08);
            const translateY = Math.abs(progress) * 8;
            const opacity = 1 - Math.min(Math.abs(progress) * 0.2, 0.4);
            
            slide.style.transform = `scale(${scale}) translateY(${translateY}px)`;
            slide.style.opacity = opacity;
          });
        },
        
        setTransition: (swiper, duration) => {
          swiper.slides.forEach(slide => {
            slide.style.transitionDuration = duration + 'ms';
          });
        }
      }
    });
  }

  /**
   * Setup news carousel
   */
  setupNewsSwiper() {
    const newsEl = document.querySelector('.sliderNews');
    if (!newsEl) return;
    
    new Swiper(newsEl, {
      pagination: {
        el: '.swiper-pagination2',
        clickable: true
      },
      spaceBetween: 30,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false
      }
    });
  }

  /**
   * Setup action buttons (document visibility toggles, etc.)
   */
  setupActionButtons() {
    const actionBtns = document.querySelectorAll('[data-action]');
    
    actionBtns.forEach(btn => {
      const handler = (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        const target = btn.dataset.actionTarget;
        
        this.handleAction(action, target);
      };
      
      btn.addEventListener('click', handler);
      this.listeners.push({ el: btn, event: 'click', handler });
    });
  }

  /**
   * Handle action commands
   */
  handleAction(action, target) {
    const targetEl = document.querySelector(target);
    if (!targetEl) return;
    
    switch (action) {
      case 'toggle':
        targetEl.classList.toggle('active');
        break;
      case 'hide':
        targetEl.classList.add('hidden');
        break;
      case 'show':
        targetEl.classList.remove('hidden');
        break;
    }
  }

  cleanup() {
    // Remove all event listeners
    this.listeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    this.listeners = [];
    this.cardState.clear();
  }
}

window.ModalsModule = ModalsModule;
