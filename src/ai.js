/**
 * AI Module
 * Handles Дія.AI chat interface and responses
 */

class AiModule {
  constructor(app) {
    this.app = app;
    this.chatContainer = null;
    this.messageHistory = [];
    this.isTyping = false;
    this.listeners = [];
    this.typingDots = null;
  }

  async init() {
    this.chatContainer = document.querySelector('[data-ai-chat]');
    if (!this.chatContainer) return;
    
    this.setupChatInterface();
    this.loadChatHistory();
  }

  /**
   * Setup chat input and send functionality
   */
  setupChatInterface() {
    const sendBtn = this.chatContainer?.querySelector('[data-ai-send]');
    const input = this.chatContainer?.querySelector('[data-ai-input]');
    
    if (!sendBtn || !input) return;
    
    const handleSend = (e) => {
      e.preventDefault();
      const message = input.value.trim();
      if (message) {
        this.sendMessage(message);
        input.value = '';
      }
    };
    
    const handleKeypress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        handleSend(e);
      }
    };
    
    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', handleKeypress);
    
    this.listeners.push({ el: sendBtn, event: 'click', handler: handleSend });
    this.listeners.push({ el: input, event: 'keypress', handler: handleKeypress });
  }

  /**
   * Send message to AI
   */
  async sendMessage(text) {
    // Add user message to UI
    this.addMessageToChat('user', text);
    this.messageHistory.push({ role: 'user', content: text });
    
    // Show typing indicator
    this.showTypingIndicator();
    
    try {
      // Simulate AI response (replace with actual API call)
      const response = await this.getAiResponse(text);
      this.removeTypingIndicator();
      
      this.addMessageToChat('ai', response);
      this.messageHistory.push({ role: 'ai', content: response });
      
      // Save chat history
      this.saveChatHistory();
    } catch (error) {
      this.app.error('AI response error:', error);
      this.removeTypingIndicator();
      this.addMessageToChat('ai', 'Вибачте, не можу дати відповідь зараз.');
    }
  }

  /**
   * Get AI response (placeholder - integrate with actual service)
   */
  async getAiResponse(userMessage) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    // Placeholder responses
    const responses = [
      'Розумію вашу потребу. Як я можу допомогти?',
      'Це цікаво. Розкажіть мені більше.',
      'Я готов допомогти вам із цим питанням.',
      'Дякую за питання. Дайте мені момент на роздуми.'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Add message to chat UI
   */
  addMessageToChat(role, text) {
    const messagesDiv = this.chatContainer?.querySelector('[data-ai-messages]');
    if (!messagesDiv) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = `ai-message ai-message-${role}`;
    messageEl.innerHTML = `<p>${this.escapeHtml(text)}</p>`;
    
    messagesDiv.appendChild(messageEl);
    
    // Animate in
    gsap.fromTo(messageEl, 
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3 }
    );
    
    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    const messagesDiv = this.chatContainer?.querySelector('[data-ai-messages]');
    if (!messagesDiv) return;
    
    this.typingDots = document.createElement('div');
    this.typingDots.className = 'ai-typing-indicator';
    this.typingDots.innerHTML = '<span></span><span></span><span></span>';
    
    messagesDiv.appendChild(this.typingDots);
    
    // Animate dots
    const dots = this.typingDots.querySelectorAll('span');
    gsap.fromTo(dots,
      { opacity: 0.4 },
      {
        opacity: 1,
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        stagger: 0.15
      }
    );
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  /**
   * Remove typing indicator
   */
  removeTypingIndicator() {
    if (this.typingDots) {
      gsap.to(this.typingDots, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          this.typingDots?.remove();
          this.typingDots = null;
        }
      });
    }
  }

  /**
   * Load chat history from storage
   */
  loadChatHistory() {
    const stored = this.app.modules.storage?.getItem('ai_chat_history', []);
    this.messageHistory = stored;
    
    // Display history (optional)
    this.messageHistory.forEach(msg => {
      this.addMessageToChat(msg.role, msg.content);
    });
  }

  /**
   * Save chat history
   */
  saveChatHistory() {
    // Keep only last 50 messages
    const toSave = this.messageHistory.slice(-50);
    this.app.modules.storage?.setItem('ai_chat_history', toSave);
  }

  /**
   * Clear chat history
   */
  clearHistory() {
    this.messageHistory = [];
    const messagesDiv = this.chatContainer?.querySelector('[data-ai-messages]');
    if (messagesDiv) {
      messagesDiv.innerHTML = '';
    }
    this.saveChatHistory();
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  cleanup() {
    this.removeTypingIndicator();
    
    this.listeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}

window.AiModule = AiModule;
