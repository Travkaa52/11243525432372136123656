/**
 * Cards Module
 * Display and manage document/ID cards
 */

class CardsModule {
  constructor(app) {
    this.app = app;
    this.listeners = [];
  }

  async init() {
    this.setupCards();
    this.setupCardDisplay();
  }

  /**
   * Setup card interactions
   */
  setupCards() {
    const cards = document.querySelectorAll('[data-card]');
    
    cards.forEach(card => {
      const handler = (e) => {
        if (!e.target.closest('[data-no-interact]')) {
          this.handleCardInteraction(card, e);
        }
      };
      
      card.addEventListener('click', handler);
      this.listeners.push({ el: card, event: 'click', handler });
    });
  }

  /**
   * Handle card interaction
   */
  handleCardInteraction(card, event) {
    const action = card.dataset.cardAction || 'view';
    
    switch (action) {
      case 'view':
        this.viewCard(card);
        break;
      case 'share':
        this.shareCard(card);
        break;
    }
  }

  /**
   * View card details
   */
  viewCard(card) {
    const modal = document.querySelector('[data-card-modal]');
    if (!modal) return;
    
    // Copy card content to modal
    const cardContent = card.cloneNode(true);
    modal.querySelector('[data-card-content]').innerHTML = cardContent.innerHTML;
    
    // Open modal with animation
    gsap.to(modal, {
      opacity: 1,
      duration: 0.3
    });
  }

  /**
   * Share card (trigger native share if available)
   */
  async shareCard(card) {
    const cardData = card.dataset;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: cardData.cardTitle || 'Моя картка',
          text: cardData.cardDescription || 'Поділіться моєю карткою',
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          this.app.error('Share error:', error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      this.copyCardToClipboard(card);
    }
  }

  /**
   * Copy card info to clipboard
   */
  copyCardToClipboard(card) {
    const text = card.textContent;
    navigator.clipboard.writeText(text).then(() => {
      this.app.log('Card copied to clipboard');
    });
  }

  /**
   * Setup card display with date/time
   */
  setupCardDisplay() {
    const dateTimeElements = document.querySelectorAll('[data-show-datetime]');
    
    dateTimeElements.forEach(el => {
      el.textContent = this.getCurrentDateTime();
      
      // Update every minute
      setInterval(() => {
        el.textContent = this.getCurrentDateTime();
      }, 60000);
    });
  }

  /**
   * Get current date and time in Ukrainian format
   */
  getCurrentDateTime() {
    const now = new Date();
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    
    return `${hours}:${minutes} | ${day}.${month}.${year}`;
  }

  cleanup() {
    this.listeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}

window.CardsModule = CardsModule;
