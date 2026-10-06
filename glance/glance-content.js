// Injected on demand into the active tab to show a panel as a floating "Glance" overlay.
(() => {
  if (window.__tabesGlanceLoaded) return;
  window.__tabesGlanceLoaded = true;

  const STYLE = `
    .backdrop {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(3px);
      opacity: 0; transition: opacity 0.18s ease;
    }
    .frame {
      position: fixed; top: 50%; left: 50%;
      width: min(1100px, 86vw); height: 86vh;
      transform: translate(-50%, -50%) scale(0.92);
      opacity: 0; transition: transform 0.18s ease, opacity 0.18s ease;
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
    }
    iframe { width: 100%; height: 100%; border: none; display: block; background: transparent; }
    :host(.open) .backdrop { opacity: 1; }
    :host(.open) .frame { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  `;

  let host = null;

  function onKeyDown(e) {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    close();
  }

  function close() {
    if (!host) return;
    const closing = host;
    host = null;
    document.removeEventListener('keydown', onKeyDown, true);
    closing.classList.remove('open');
    setTimeout(() => closing.remove(), 200);
  }

  function show(url) {
    if (host) {
      host.remove();
      host = null;
    }
    host = document.createElement('tabes-glance');
    host.style.cssText = 'all: initial; position: fixed; inset: 0; z-index: 2147483647;';
    const root = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = STYLE;
    const backdrop = document.createElement('div');
    backdrop.className = 'backdrop';
    backdrop.addEventListener('click', close);
    const frame = document.createElement('div');
    frame.className = 'frame';
    const iframe = document.createElement('iframe');
    iframe.src = url;
    frame.appendChild(iframe);
    root.append(style, backdrop, frame);

    document.documentElement.appendChild(host);
    document.addEventListener('keydown', onKeyDown, true);
    // Force a layout so the opening transition runs.
    host.getBoundingClientRect();
    host.classList.add('open');
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'tabesShowGlance') show(message.url);
    if (message.type === 'tabesCloseGlance') close();
  });
})();
