// Floating Tabes bar: a draggable dock of panel icons plus a movable, resizable
// panel window drawn over every page while the floating mode is enabled.
// State lives in storage.local "float" so position and open panel follow the user across tabs.
(() => {
  if (window.__tabesFloatLoaded) return;
  window.__tabesFloatLoaded = true;

  const DEFAULT_STATE = { enabled: false, vertical: true, dock: null, win: null, panel: null, minimized: false };
  const MIN_W = 280;
  const MIN_H = 200;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const STYLE = `
    .dock, .win {
      position: fixed;
      font: 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--text-primary, #c0caf5);
      background: var(--bg-primary, #1a1b26);
      border: 1px solid var(--border, #3b4261);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      box-sizing: border-box;
    }
    .dock {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 6px; border-radius: 14px; z-index: 1;
    }
    .dock.horizontal { flex-direction: row; }
    .grip {
      width: 28px; height: 12px; flex-shrink: 0; cursor: grab; touch-action: none; opacity: 0.5;
      background-image: radial-gradient(currentColor 1px, transparent 1.5px);
      background-size: 6px 6px; background-position: center;
    }
    .dock.horizontal .grip { width: 12px; height: 28px; }
    .icons { display: flex; flex-direction: inherit; gap: 4px; }
    button {
      display: flex; align-items: center; justify-content: center;
      padding: 0; margin: 0; border: none; border-radius: 8px;
      background: transparent; color: inherit; cursor: pointer; font: inherit;
    }
    button:hover { background: var(--bg-hover, #3b4261); }
    .icon { width: 36px; height: 36px; }
    .icon.active { background: var(--bg-hover, #3b4261); box-shadow: inset 0 0 0 2px var(--accent, #7aa2f7); }
    .icon img { width: 20px; height: 20px; object-fit: contain; }
    .letter {
      width: 22px; height: 22px; border-radius: 6px; font-size: 12px; font-weight: 600;
      display: flex; align-items: center; justify-content: center;
      background: var(--accent, #7aa2f7); color: var(--bg-primary, #1a1b26);
    }
    .sep { width: 24px; height: 1px; background: var(--border, #3b4261); }
    .dock.horizontal .sep { width: 1px; height: 24px; }
    .tool { width: 28px; height: 28px; color: var(--text-secondary, #a9b1d6); }
    .win { display: flex; flex-direction: column; border-radius: 12px; overflow: hidden; }
    .win.hidden { display: none; }
    .header {
      display: flex; align-items: center; gap: 6px; height: 34px; flex-shrink: 0;
      padding: 0 6px 0 10px; cursor: grab; user-select: none; touch-action: none;
      background: var(--bg-secondary, #24283b); border-bottom: 1px solid var(--border, #3b4261);
    }
    .header img { width: 16px; height: 16px; object-fit: contain; }
    .header img[hidden] { display: none; }
    .title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
    .body { flex: 1; position: relative; }
    iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; background: white; }
    .resize {
      position: absolute; right: 0; bottom: 0; width: 16px; height: 16px;
      cursor: nwse-resize; touch-action: none;
      background: linear-gradient(135deg, transparent 55%, var(--border, #3b4261) 55%);
    }
    :host(.dragging) { user-select: none; }
    :host(.dragging) iframe { pointer-events: none; }
  `;

  const ICONS = {
    rotate: ['M3 8a5 5 0 0 1 9-3M13 8a5 5 0 0 1-9 3', 'M12 2v3H9M4 14v-3h3'],
    off: ['M4 4l8 8M12 4l-8 8'],
    reload: ['M13.5 8A5.5 5.5 0 1 1 8 2.5', 'M13 2v3.5h-3.5'],
    openTab: ['M9 2h5v5M14 2L7 9M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3'],
    minimize: ['M4 8h8'],
    close: ['M4 4l8 8M12 4l-8 8']
  };

  let state = { ...DEFAULT_STATE };
  let panels = [];
  let host = null;
  let ui = null;
  let loadedPanel = null;

  function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function svgIcon(name) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('fill', 'none');
    for (const d of ICONS[name]) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);
    }
    return svg;
  }

  function toolButton(name, title, onClick) {
    const btn = el('button', 'tool');
    btn.dataset.action = name;
    btn.title = title;
    btn.appendChild(svgIcon(name));
    btn.addEventListener('click', onClick);
    return btn;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function save(patch) {
    state = { ...state, ...patch };
    browser.storage.local.set({ float: state });
    render();
  }

  function panelUrl(id) {
    return browser.runtime.getURL(`glance/glance.html?id=${encodeURIComponent(id)}&bare=1`);
  }

  function place(target, x, y) {
    const rect = target.getBoundingClientRect();
    target.style.left = clamp(x, 0, Math.max(0, window.innerWidth - rect.width)) + 'px';
    target.style.top = clamp(y, 0, Math.max(0, window.innerHeight - rect.height)) + 'px';
  }

  // Pointer capture keeps the drag going over the iframe; the iframe also stops
  // taking pointer events while dragging (:host(.dragging)).
  function trackPointer(handle, onStart, onMove, onEnd) {
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button')) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      host.classList.add('dragging');
      const start = onStart(e);
      const move = (ev) => onMove(ev, start);
      const end = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', end);
        handle.removeEventListener('pointercancel', end);
        host.classList.remove('dragging');
        onEnd();
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
    });
  }

  function makeMovable(handle, target, key) {
    trackPointer(handle,
      (e) => {
        const rect = target.getBoundingClientRect();
        return { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
      },
      (e, s) => place(target, e.clientX - s.dx, e.clientY - s.dy),
      () => {
        const rect = target.getBoundingClientRect();
        const pos = { ...(state[key] || {}), x: Math.round(rect.left), y: Math.round(rect.top) };
        if (key === 'win') Object.assign(pos, { w: Math.round(rect.width), h: Math.round(rect.height) });
        save({ [key]: pos });
      });
  }

  function build() {
    host = el('tabes-float');
    host.style.cssText = 'all: initial; position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647;';
    const root = host.attachShadow({ mode: 'open' });
    const style = el('style');
    style.textContent = STYLE;

    const dock = el('div', 'dock');
    const grip = el('div', 'grip');
    grip.title = 'Drag to move';
    const icons = el('div', 'icons');
    dock.append(grip, icons, el('div', 'sep'),
      toolButton('rotate', 'Switch orientation', () => save({ vertical: !state.vertical })),
      toolButton('off', 'Turn off floating bar', () => save({ enabled: false })));

    const win = el('div', 'win hidden');
    const header = el('div', 'header');
    const winIcon = el('img');
    winIcon.alt = '';
    winIcon.addEventListener('error', () => { winIcon.hidden = true; });
    const title = el('div', 'title');
    header.append(winIcon, title,
      toolButton('reload', 'Reload', () => { loadedPanel = null; renderWindow(); }),
      toolButton('openTab', 'Open in new tab', () => {
        const panel = panels.find(p => p.id === state.panel);
        if (panel) browser.runtime.sendMessage({ type: 'openTab', url: panel.url });
      }),
      toolButton('minimize', 'Minimize', () => save({ minimized: true })),
      toolButton('close', 'Close', () => save({ panel: null, minimized: false })));
    const body = el('div', 'body');
    body.appendChild(el('iframe'));
    const resize = el('div', 'resize');
    win.append(header, body, resize);

    root.append(style, dock, win);
    document.documentElement.appendChild(host);
    ui = { dock, icons, win, winIcon, title, body };

    makeMovable(grip, dock, 'dock');
    makeMovable(header, win, 'win');
    trackPointer(resize,
      () => win.getBoundingClientRect(),
      (e, rect) => {
        win.style.width = clamp(e.clientX - rect.left, MIN_W, window.innerWidth - rect.left) + 'px';
        win.style.height = clamp(e.clientY - rect.top, MIN_H, window.innerHeight - rect.top) + 'px';
      },
      () => {
        const rect = win.getBoundingClientRect();
        save({ win: { x: Math.round(rect.left), y: Math.round(rect.top), w: Math.round(rect.width), h: Math.round(rect.height) } });
      });
  }

  function teardown() {
    if (!host) return;
    host.remove();
    host = null;
    ui = null;
    loadedPanel = null;
  }

  function renderIcons() {
    ui.icons.replaceChildren(...panels.map(panel => {
      const btn = el('button', 'icon');
      btn.title = panel.title;
      btn.dataset.id = panel.id;
      btn.classList.toggle('active', panel.id === state.panel && !state.minimized);
      const letter = el('span', 'letter');
      letter.textContent = (panel.title || '?').charAt(0).toUpperCase();
      if (panel.icon) {
        const img = el('img');
        img.alt = '';
        img.src = panel.icon;
        img.addEventListener('error', () => img.replaceWith(letter));
        btn.appendChild(img);
      } else {
        btn.appendChild(letter);
      }
      btn.addEventListener('click', () => {
        if (state.panel === panel.id) save({ minimized: !state.minimized });
        else save({ panel: panel.id, minimized: false });
      });
      return btn;
    }));
  }

  function renderWindow() {
    const panel = panels.find(p => p.id === state.panel);
    ui.win.classList.toggle('hidden', !panel || state.minimized);
    if (!panel) {
      if (loadedPanel) {
        ui.body.replaceChildren(el('iframe'));
        loadedPanel = null;
      }
      return;
    }
    ui.title.textContent = panel.title;
    ui.winIcon.hidden = !panel.icon;
    if (panel.icon) ui.winIcon.src = panel.icon;
    if (loadedPanel !== panel.id) {
      const iframe = el('iframe');
      iframe.src = panelUrl(panel.id);
      ui.body.replaceChildren(iframe);
      loadedPanel = panel.id;
    }
  }

  function layout() {
    const { innerWidth: vw, innerHeight: vh } = window;
    ui.dock.classList.toggle('horizontal', !state.vertical);
    const dock = state.dock || { x: vw - 70, y: 80 };
    place(ui.dock, dock.x, dock.y);

    const h = Math.min(640, vh - 120);
    const win = state.win || { w: 420, h, x: vw - 420 - 90, y: 60 };
    ui.win.style.width = clamp(win.w, MIN_W, vw) + 'px';
    ui.win.style.height = clamp(win.h, MIN_H, vh) + 'px';
    place(ui.win, win.x, win.y);
  }

  function render() {
    if (!host) return;
    renderIcons();
    renderWindow();
    layout();
  }

  async function loadData() {
    const [p, settings] = await Promise.all([
      browser.runtime.sendMessage({ type: 'getPanels' }),
      browser.runtime.sendMessage({ type: 'getSettings' })
    ]);
    panels = p || [];
    if (host) applyTabesTheme(settings, host);
    render();
  }

  // Background tabs only build/update the UI once they are shown, so switching
  // panels doesn't load iframes in every open tab.
  function sync(newState) {
    state = { ...DEFAULT_STATE, ...newState };
    if (!state.enabled) {
      teardown();
      return;
    }
    if (document.hidden) return;
    if (!host) {
      build();
      loadData();
    }
    render();
  }

  function readState() {
    browser.storage.local.get('float').then(data => sync(data.float));
  }

  browser.storage.onChanged.addListener((changes) => {
    if (changes.float) sync(changes.float.newValue);
    if (host && (changes.panels || changes.settings)) loadData();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) readState();
  });
  document.addEventListener('fullscreenchange', () => {
    if (host) host.style.display = document.fullscreenElement ? 'none' : '';
  });
  window.addEventListener('resize', render);

  readState();
})();
