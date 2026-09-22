/**
 * Admin Module
 * Developer/admin panel accessible via Ctrl+Shift+X
 */

class AdminModule {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
    this.adminPanel = null;
  }

  async init() {
    this.createAdminPanel();
    this.setupShortcuts();
  }

  /**
   * Create admin panel UI
   */
  createAdminPanel() {
    const panel = document.createElement('div');
    panel.id = 'admin-panel';
    panel.className = 'admin-panel hidden';
    panel.innerHTML = `
      <div class="admin-header">
        <h2>Дія - Admin Panel</h2>
        <button data-admin-close>✕</button>
      </div>
      
      <div class="admin-tabs">
        <button class="admin-tab active" data-tab="info">Info</button>
        <button class="admin-tab" data-tab="debug">Debug</button>
        <button class="admin-tab" data-tab="storage">Storage</button>
        <button class="admin-tab" data-tab="tools">Tools</button>
      </div>
      
      <div class="admin-content">
        <div class="admin-tab-content active" data-content="info">
          <h3>Application Info</h3>
          <p><strong>Version:</strong> <span id="app-version">1.0.0</span></p>
          <p><strong>Session:</strong> <span id="session-id"></span></p>
          <p><strong>Modules Loaded:</strong> <span id="modules-count"></span></p>
          <p><strong>Storage Used:</strong> <span id="storage-used"></span></p>
          <p><strong>Viewport:</strong> <span id="viewport-size"></span></p>
        </div>
        
        <div class="admin-tab-content" data-content="debug">
          <h3>Debug Console</h3>
          <button data-admin-action="logs">Show Console Logs</button>
          <button data-admin-action="performance">Show Performance</button>
          <button data-admin-action="errors">Show Errors</button>
          <div id="debug-output" style="background: #000; color: #0f0; padding: 10px; font-family: monospace; max-height: 200px; overflow-y: auto; margin-top: 10px;"></div>
        </div>
        
        <div class="admin-tab-content" data-content="storage">
          <h3>Local Storage</h3>
          <button data-admin-action="clear-storage">Clear All Storage</button>
          <button data-admin-action="export-storage">Export Storage</button>
          <button data-admin-action="list-storage">List Storage Keys</button>
          <div id="storage-list" style="margin-top: 10px; max-height: 200px; overflow-y: auto;"></div>
        </div>
        
        <div class="admin-tab-content" data-content="tools">
          <h3>Developer Tools</h3>
          <button data-admin-action="reload">Reload App</button>
          <button data-admin-action="clear-cache">Clear Cache</button>
          <button data-admin-action="unlock">Force Unlock</button>
          <button data-admin-action="trigger-error">Trigger Test Error</button>
          <hr>
          <label>
            <input type="checkbox" id="debug-mode"> Debug Mode
          </label>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.adminPanel = panel;
    
    this.setupAdminUI();
  }

  /**
   * Setup admin panel interactions
   */
  setupAdminUI() {
    // Close button
    const closeBtn = this.adminPanel.querySelector('[data-admin-close]');
    closeBtn.addEventListener('click', () => this.toggle());
    
    // Tab switching
    const tabs = this.adminPanel.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });
    
    // Actions
    const actions = this.adminPanel.querySelectorAll('[data-admin-action]');
    actions.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.adminAction;
        this.executeAction(action);
      });
    });
    
    // Debug mode toggle
    const debugToggle = this.adminPanel.querySelector('#debug-mode');
    debugToggle.checked = this.app.config.enableDebug;
    debugToggle.addEventListener('change', (e) => {
      this.app.config.enableDebug = e.target.checked;
      localStorage.setItem('DEBUG_MODE', e.target.checked);
    });
    
    this.updateInfo();
  }

  /**
   * Update info display
   */
  updateInfo() {
    const modulesCount = Object.keys(this.app.modules).length;
    const storageUsed = this.calculateStorageUsed();
    const viewport = `${window.innerWidth}x${window.innerHeight}`;
    
    this.adminPanel.querySelector('#modules-count').textContent = modulesCount;
    this.adminPanel.querySelector('#storage-used').textContent = this.formatBytes(storageUsed);
    this.adminPanel.querySelector('#viewport-size').textContent = viewport;
  }

  /**
   * Switch admin tab
   */
  switchTab(tabName) {
    const tabs = this.adminPanel.querySelectorAll('.admin-tab');
    const contents = this.adminPanel.querySelectorAll('.admin-tab-content');
    
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    
    this.adminPanel.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    this.adminPanel.querySelector(`[data-content="${tabName}"]`).classList.add('active');
  }

  /**
   * Execute admin action
   */
  executeAction(action) {
    switch (action) {
      case 'logs':
        this.showConsoleLogs();
        break;
      case 'performance':
        this.showPerformance();
        break;
      case 'errors':
        this.showErrors();
        break;
      case 'clear-storage':
        if (confirm('Clear all app storage?')) {
          this.app.modules.storage?.clear();
          alert('Storage cleared');
        }
        break;
      case 'export-storage':
        this.exportStorage();
        break;
      case 'list-storage':
        this.listStorage();
        break;
      case 'reload':
        location.reload();
        break;
      case 'clear-cache':
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
            alert('Cache cleared');
          });
        }
        break;
      case 'unlock':
        this.app.modules.security?.unlock();
        alert('App unlocked');
        break;
      case 'trigger-error':
        throw new Error('Test error triggered');
    }
  }

  /**
   * Show console logs in panel
   */
  showConsoleLogs() {
    const output = this.adminPanel.querySelector('#debug-output');
    output.innerHTML += '<p>[Logs captured in console]</p>';
  }

  /**
   * Show performance metrics
   */
  showPerformance() {
    const output = this.adminPanel.querySelector('#debug-output');
    const perf = performance.getEntriesByType('navigation')[0];
    
    if (perf) {
      output.innerHTML = `
        <p>DNS: ${Math.round(perf.domainLookupEnd - perf.domainLookupStart)}ms</p>
        <p>TCP: ${Math.round(perf.connectEnd - perf.connectStart)}ms</p>
        <p>TTFB: ${Math.round(perf.responseStart - perf.requestStart)}ms</p>
        <p>DOMContentLoaded: ${Math.round(perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart)}ms</p>
        <p>Load: ${Math.round(perf.loadEventEnd - perf.loadEventStart)}ms</p>
      `;
    }
  }

  /**
   * Show errors
   */
  showErrors() {
    const output = this.adminPanel.querySelector('#debug-output');
    output.innerHTML = '<p>[Errors logged in console]</p>';
  }

  /**
   * Export storage as JSON
   */
  exportStorage() {
    const data = {};
    const prefix = this.app.config.storagePrefix;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        data[key] = localStorage.getItem(key);
      }
    }
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dia-storage-export.json';
    a.click();
  }

  /**
   * List storage keys
   */
  listStorage() {
    const output = this.adminPanel.querySelector('#storage-list');
    const prefix = this.app.config.storagePrefix;
    
    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr><th style="border: 1px solid #ccc; padding: 5px;">Key</th><th style="border: 1px solid #ccc; padding: 5px;">Size</th></tr>';
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        html += `<tr><td style="border: 1px solid #ccc; padding: 5px; word-break: break-all;">${key}</td>`;
        html += `<td style="border: 1px solid #ccc; padding: 5px;">${this.formatBytes(size)}</td></tr>`;
      }
    }
    
    html += '</table>';
    output.innerHTML = html;
  }

  /**
   * Calculate total storage used
   */
  calculateStorageUsed() {
    let total = 0;
    const prefix = this.app.config.storagePrefix;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        total += new Blob([localStorage.getItem(key)]).size;
      }
    }
    
    return total;
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Setup keyboard shortcut (Ctrl+Shift+X)
   */
  setupShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Toggle admin panel visibility
   */
  toggle() {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      this.adminPanel.classList.remove('hidden');
      this.updateInfo();
      gsap.to(this.adminPanel, { opacity: 1, duration: 0.3 });
    } else {
      gsap.to(this.adminPanel, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          this.adminPanel.classList.add('hidden');
        }
      });
    }
  }

  cleanup() {
    // Admin panel cleanup
  }
}

window.AdminModule = AdminModule;
