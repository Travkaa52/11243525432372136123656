/**
 * Storage Module
 * Handles localStorage with compression and cleanup
 */

class StorageModule {
  constructor(app) {
    this.app = app;
    this.prefix = app.config.storagePrefix;
    this.maxStorageSize = 5 * 1024 * 1024; // 5MB max
  }

  async init() {
    this.cleanupOldData();
  }

  /**
   * Save data with auto-compression for images
   */
  setItem(key, value, isImage = false) {
    try {
      const fullKey = this.prefix + key;
      let dataToStore = value;
      
      // Compress images before storage
      if (isImage && typeof value === 'string' && value.startsWith('data:image')) {
        dataToStore = this.compressImage(value);
      }
      
      const json = JSON.stringify({ data: dataToStore, timestamp: Date.now() });
      
      // Check size before storing
      if (this.estimateSize(json) > this.maxStorageSize) {
        this.app.warn('Storage limit exceeded, clearing old data');
        this.cleanup();
      }
      
      localStorage.setItem(fullKey, json);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this.app.warn('Storage quota exceeded');
        this.cleanup();
        return false;
      }
      this.app.error('Storage error:', error);
      return false;
    }
  }

  /**
   * Retrieve stored data
   */
  getItem(key, fallback = null) {
    try {
      const fullKey = this.prefix + key;
      const stored = localStorage.getItem(fullKey);
      
      if (!stored) return fallback;
      
      const { data } = JSON.parse(stored);
      return data;
    } catch (error) {
      this.app.error('Retrieval error:', error);
      return fallback;
    }
  }

  /**
   * Compress image to canvas and return as data URL
   */
  compressImage(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        let { width, height } = img;
        const maxWidth = this.app.config.imageMaxWidth;
        const maxHeight = this.app.config.imageMaxHeight;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG
        const compressed = canvas.toDataURL(
          'image/jpeg',
          this.app.config.imageCompressionQuality
        );
        
        resolve(compressed);
      };
      
      img.onerror = () => {
        // If image fails, return original
        resolve(dataUrl);
      };
      
      img.src = dataUrl;
    });
  }

  /**
   * Cleanup old data (older than 7 days)
   */
  cleanupOldData() {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const keysToDelete = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key.startsWith(this.prefix)) continue;
      
      try {
        const { timestamp } = JSON.parse(localStorage.getItem(key));
        if (timestamp && timestamp < sevenDaysAgo) {
          keysToDelete.push(key);
        }
      } catch (e) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => localStorage.removeItem(key));
    if (keysToDelete.length > 0) {
      this.app.log(`Cleaned up ${keysToDelete.length} old items`);
    }
  }

  /**
   * Emergency cleanup - remove oldest data
   */
  cleanup() {
    const entries = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key.startsWith(this.prefix)) continue;
      
      try {
        const { timestamp } = JSON.parse(localStorage.getItem(key));
        entries.push({ key, timestamp });
      } catch (e) {
        localStorage.removeItem(key);
      }
    }
    
    // Sort by timestamp and remove oldest 25%
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(entries.length * 0.25);
    
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i].key);
    }
    
    this.app.log(`Emergency cleanup: removed ${toRemove} items`);
  }

  /**
   * Estimate size of string in bytes
   */
  estimateSize(str) {
    return new Blob([str]).size;
  }

  /**
   * Clear all app data
   */
  clear() {
    const keysToDelete = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.prefix)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => localStorage.removeItem(key));
    this.app.log(`Cleared ${keysToDelete.length} items`);
  }

  cleanup() {
    // Module cleanup
  }
}

window.StorageModule = StorageModule;
