class TabesSidebar {
  constructor() {
    this.panels = [];
    this.activePanel = null;
    this.settings = null;
    this.contextMenuTarget = null;
    this.editingId = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadPanels();
    this.bindEvents();
    this.applySettings();
    this.render();

    if (this.activePanel) {
      this.openPanel(this.activePanel);
    }

    // Listen for storage changes (settings updated from popup/options)
    browser.storage.onChanged.addListener((changes) => {
      if (changes.settings) {
        this.settings = changes.settings.newValue;
        this.applySettings();
      }
      if (changes.panels) {
        this.panels = changes.panels.newValue || [];
        if (this.activePanel && !this.panels.some(p => p.id === this.activePanel)) {
          this.closePanel();
        }
        this.render();
      }
    });
  }

  async loadSettings() {
    this.settings = await browser.runtime.sendMessage({ type: "getSettings" });
  }

  async loadPanels() {
    this.panels = await browser.runtime.sendMessage({ type: "getPanels" });
    const activePanelId = await browser.runtime.sendMessage({ type: "getActivePanel" });
    if (activePanelId) {
      this.activePanel = activePanelId;
    }
  }

  applySettings() {
    if (!this.settings) return;
    const root = document.documentElement;
    const s = this.settings;

    // Apply CSS variables
    root.style.setProperty('--bg-primary', s.bgPrimary);
    root.style.setProperty('--bg-secondary', s.bgSecondary);
    root.style.setProperty('--text-primary', s.textColor);
    root.style.setProperty('--accent', s.accentColor);
    root.style.setProperty('--panel-icon-size', s.iconSize + 'px');
    root.style.setProperty('--radius', s.borderRadius + 'px');
    root.style.setProperty('--radius-sm', Math.max(4, s.borderRadius - 2) + 'px');

    // Font size
    document.body.style.fontSize = s.fontSize + 'px';

    // Panel icons position
    const container = document.getElementById('sidebar-container');
    container.className = '';
    container.classList.add(`icons-${s.panelIconsPosition}`);

    // Compact mode
    if (s.compactMode) {
      container.classList.add('compact');
    }

    // Header visibility
    const header = document.getElementById('panel-header');
    if (this.activePanel) {
      header.classList.toggle('hidden', !s.showHeader);
    }

    // Custom CSS
    let customStyle = document.getElementById('custom-style');
    if (!customStyle) {
      customStyle = document.createElement('style');
      customStyle.id = 'custom-style';
      document.head.appendChild(customStyle);
    }
    customStyle.textContent = s.customCSS || '';
  }

  bindEvents() {
    // Add panel button
    document.getElementById('add-panel-btn').addEventListener('click', () => this.showAddDialog());

    // Dialog events
    document.getElementById('dialog-cancel').addEventListener('click', () => this.hideAddDialog());
    document.getElementById('dialog-add').addEventListener('click', () => this.submitDialog());
    document.querySelector('.dialog-overlay').addEventListener('click', () => this.hideAddDialog());

    // Header navigation buttons
    document.getElementById('btn-back').addEventListener('click', () => this.navigateBack());
    document.getElementById('btn-forward').addEventListener('click', () => this.navigateForward());
    document.getElementById('btn-reload').addEventListener('click', () => this.reloadPanel());
    document.getElementById('btn-home').addEventListener('click', () => this.goHome());
    document.getElementById('btn-open-tab').addEventListener('click', () => this.openInTab());
    document.getElementById('btn-close').addEventListener('click', () => this.closePanel());

    // Context menu
    document.addEventListener('click', () => this.hideContextMenu());
    document.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('click', (e) => this.handleContextAction(e.target.dataset.action));
    });

    // Enter key in URL input
    document.getElementById('panel-url').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submitDialog();
    });

    // Settings button (gear icon at bottom)
    document.getElementById('add-panel-btn').addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.openSettings();
    });
  }

  render() {
    const list = document.getElementById('panel-icons-list');
    list.innerHTML = '';

    this.panels.forEach(panel => {
      const btn = document.createElement('button');
      btn.className = 'panel-icon-btn';
      btn.title = panel.title;
      btn.dataset.id = panel.id;

      if (panel.id === this.activePanel) {
        btn.classList.add('active');
      }

      // Icon or fallback
      if (panel.icon) {
        const img = document.createElement('img');
        img.src = panel.icon;
        img.alt = panel.title;
        img.onerror = () => {
          img.remove();
          const fallback = document.createElement('span');
          fallback.className = 'fallback-icon';
          fallback.textContent = panel.title.charAt(0);
          btn.appendChild(fallback);
        };
        btn.appendChild(img);
      } else {
        const fallback = document.createElement('span');
        fallback.className = 'fallback-icon';
        fallback.textContent = panel.title.charAt(0);
        btn.appendChild(fallback);
      }

      // Click to activate
      btn.addEventListener('click', () => this.activatePanel(panel.id));

      // Right-click context menu
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showContextMenu(e, panel.id);
      });

      // Drag and drop for reordering
      btn.draggable = true;
      btn.addEventListener('dragstart', (e) => this.onDragStart(e, panel.id));
      btn.addEventListener('dragover', (e) => this.onDragOver(e));
      btn.addEventListener('drop', (e) => this.onDrop(e, panel.id));
      btn.addEventListener('dragend', (e) => this.onDragEnd(e));

      list.appendChild(btn);
    });
  }

  activatePanel(id) {
    if (this.activePanel === id) {
      this.closePanel();
      return;
    }
    this.openPanel(id);
  }

  openPanel(id) {
    const panel = this.panels.find(p => p.id === id);
    if (!panel) {
      this.closePanel();
      return;
    }

    this.activePanel = id;
    browser.runtime.sendMessage({ type: "setActivePanel", id });

    // Update UI
    document.getElementById('welcome-screen').style.display = 'none';
    const iframe = document.getElementById('panel-iframe');
    iframe.classList.remove('hidden');
    iframe.src = panel.url;

    // Show header
    const header = document.getElementById('panel-header');
    if (this.settings.showHeader) {
      header.classList.remove('hidden');
    }
    document.getElementById('panel-title').textContent = panel.title;

    // Update active icon
    document.querySelectorAll('.panel-icon-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.id === id);
    });
  }

  closePanel() {
    this.activePanel = null;
    browser.runtime.sendMessage({ type: "setActivePanel", id: null });

    document.getElementById('panel-iframe').classList.add('hidden');
    document.getElementById('panel-iframe').src = '';
    document.getElementById('panel-header').classList.add('hidden');
    document.getElementById('welcome-screen').style.display = '';

    document.querySelectorAll('.panel-icon-btn').forEach(btn => btn.classList.remove('active'));
  }

  navigateBack() {
    const iframe = document.getElementById('panel-iframe');
    try { iframe.contentWindow.history.back(); } catch(e) {}
  }

  navigateForward() {
    const iframe = document.getElementById('panel-iframe');
    try { iframe.contentWindow.history.forward(); } catch(e) {}
  }

  reloadPanel() {
    const iframe = document.getElementById('panel-iframe');
    if (iframe.src) {
      iframe.src = iframe.src;
    }
  }

  goHome() {
    if (!this.activePanel) return;
    const panel = this.panels.find(p => p.id === this.activePanel);
    if (panel) {
      document.getElementById('panel-iframe').src = panel.url;
    }
  }

  openInTab() {
    const iframe = document.getElementById('panel-iframe');
    if (iframe.src) {
      browser.tabs.create({ url: iframe.src });
    }
  }

  // Add / edit panel dialog
  showAddDialog() {
    document.getElementById('add-panel-dialog').classList.remove('hidden');
    document.getElementById('panel-url').focus();
  }

  hideAddDialog() {
    document.getElementById('add-panel-dialog').classList.add('hidden');
    document.getElementById('panel-url').value = '';
    document.getElementById('panel-name').value = '';
    document.getElementById('panel-mobile').checked = false;
    document.getElementById('dialog-add').textContent = 'Add Panel';
    this.editingId = null;
  }

  normalizeUrl(input) {
    let url = input.trim();
    if (!url) return null;
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    try {
      return new URL(url).href;
    } catch {
      return null;
    }
  }

  readDialog() {
    const rawUrl = document.getElementById('panel-url').value;
    if (!rawUrl.trim()) return null;
    const url = this.normalizeUrl(rawUrl);
    if (!url) {
      alert('Please enter a valid URL');
      return null;
    }
    return {
      url,
      title: document.getElementById('panel-name').value.trim(),
      useragent: document.getElementById('panel-mobile').checked
    };
  }

  submitDialog() {
    if (this.editingId) {
      this.updatePanel(this.editingId);
    } else {
      this.addPanel();
    }
  }

  async addPanel() {
    const values = this.readDialog();
    if (!values) return;

    const newPanel = await browser.runtime.sendMessage({
      type: "addPanel",
      url: values.url,
      title: values.title || undefined,
      useragent: values.useragent
    });

    if (!this.panels.some(p => p.id === newPanel.id)) {
      this.panels.push(newPanel);
    }
    this.render();
    this.hideAddDialog();
  }

  async updatePanel(id) {
    const values = this.readDialog();
    if (!values) return;

    const updates = {
      url: values.url,
      title: values.title || new URL(values.url).hostname,
      useragent: values.useragent
    };
    await browser.runtime.sendMessage({ type: "updatePanel", id, updates });

    const idx = this.panels.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.panels[idx] = { ...this.panels[idx], ...updates };
    }
    if (this.activePanel === id) {
      document.getElementById('panel-title').textContent = updates.title;
    }

    this.render();
    this.hideAddDialog();
  }

  // Context menu
  showContextMenu(event, panelId) {
    this.contextMenuTarget = panelId;
    const menu = document.getElementById('context-menu');
    menu.classList.remove('hidden');
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';

    // Ensure menu is within viewport
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = (window.innerWidth - rect.width - 4) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = (window.innerHeight - rect.height - 4) + 'px';
    }
  }

  hideContextMenu() {
    document.getElementById('context-menu').classList.add('hidden');
    this.contextMenuTarget = null;
  }

  async handleContextAction(action) {
    const id = this.contextMenuTarget;
    if (!id) return;

    switch (action) {
      case 'edit':
        this.editPanel(id);
        break;
      case 'reload':
        if (this.activePanel === id) this.reloadPanel();
        break;
      case 'open-tab': {
        const panel = this.panels.find(p => p.id === id);
        if (panel) browser.tabs.create({ url: panel.url });
        break;
      }
      case 'remove':
        await browser.runtime.sendMessage({ type: "removePanel", id });
        this.panels = this.panels.filter(p => p.id !== id);
        if (this.activePanel === id) this.closePanel();
        this.render();
        break;
    }
    this.hideContextMenu();
  }

  editPanel(id) {
    const panel = this.panels.find(p => p.id === id);
    if (!panel) return;
    this.editingId = id;
    document.getElementById('panel-url').value = panel.url;
    document.getElementById('panel-name').value = panel.title;
    document.getElementById('panel-mobile').checked = !!panel.useragent;
    document.getElementById('dialog-add').textContent = 'Update';
    this.showAddDialog();
  }

  // Drag and drop
  onDragStart(e, id) {
    e.dataTransfer.setData('text/plain', id);
    e.target.classList.add('dragging');
  }

  onDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }

  onDrop(e, targetId) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId === targetId) return;

    const sourceIdx = this.panels.findIndex(p => p.id === sourceId);
    const targetIdx = this.panels.findIndex(p => p.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;
    const [moved] = this.panels.splice(sourceIdx, 1);
    this.panels.splice(targetIdx, 0, moved);

    browser.runtime.sendMessage({ type: "reorderPanels", panels: this.panels });
    this.render();
  }

  onDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  }

  openSettings() {
    browser.runtime.openOptionsPage();
  }
}

// Initialize
const sidebar = new TabesSidebar();
