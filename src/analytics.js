/**
 * Analytics Module
 * Tracking, geolocation, and event logging
 */

class AnalyticsModule {
  constructor(app) {
    this.app = app;
    this.sessionId = this.generateSessionId();
    this.events = [];
    this.location = null;
  }

  async init() {
    this.requestGeolocation();
    this.setupEventTracking();
  }

  /**
   * Request user geolocation
   */
  requestGeolocation() {
    if (!navigator.geolocation) {
      this.app.log('Geolocation not supported');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now()
        };
        this.app.log('Location obtained:', this.location);
      },
      (error) => {
        this.app.log('Geolocation error:', error.message);
        // Don't track if user denies permission
      },
      { timeout: 10000, maximumAge: 3600000 }
    );
  }

  /**
   * Setup automatic event tracking
   */
  setupEventTracking() {
    // Track important user actions
    const trackableActions = [
      'security:unlocked',
      'app:ready'
    ];
    
    trackableActions.forEach(action => {
      this.app.on(action, (e) => {
        this.trackEvent(action, e.detail);
      });
    });
    
    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('app:visibility', {
        hidden: document.hidden
      });
    });
  }

  /**
   * Track event
   */
  trackEvent(eventName, data = {}) {
    const event = {
      name: eventName,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      location: this.location,
      data
    };
    
    this.events.push(event);
    this.app.log('Event tracked:', eventName);
    
    // Send to server if queue gets large
    if (this.events.length >= 10) {
      this.flushEvents();
    }
  }

  /**
   * Flush events to server
   */
  async flushEvents() {
    if (this.events.length === 0) return;
    
    const eventsToSend = [...this.events];
    this.events = [];
    
    try {
      // Send to analytics endpoint (placeholder)
      const endpoint = '/api/analytics';
      
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend })
      }).catch(() => {
        // Fail silently - analytics not critical
      });
      
      this.app.log(`Sent ${eventsToSend.length} events`);
    } catch (error) {
      // Restore events if send fails
      this.events = eventsToSend;
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  cleanup() {
    // Flush remaining events
    this.flushEvents();
  }
}

window.AnalyticsModule = AnalyticsModule;
