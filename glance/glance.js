// Hosts a panel inside the Glance overlay (an iframe injected into the page by
// glance-content.js) or, on pages that can't be scripted, a standalone popup window.
const params = new URLSearchParams(location.search);
const panelId = params.get('id');
const isWindow = params.get('window') === '1';

function closeGlance() {
  if (isWindow) {
    window.close();
  } else {
    browser.runtime.sendMessage({ type: 'closeGlance' });
  }
}

async function init() {
  const [panels, settings] = await Promise.all([
    browser.runtime.sendMessage({ type: 'getPanels' }),
    browser.runtime.sendMessage({ type: 'getSettings' })
  ]);
  applyTabesTheme(settings);

  const panel = (panels || []).find(p => p.id === panelId);
  if (!panel) {
    closeGlance();
    return;
  }

  document.title = panel.title;
  document.getElementById('glance-title').textContent = panel.title;
  const icon = document.getElementById('glance-icon');
  if (panel.icon) {
    icon.src = panel.icon;
    icon.addEventListener('error', () => { icon.hidden = true; });
  } else {
    icon.hidden = true;
  }
  document.getElementById('glance-iframe').src = panel.url;

  document.getElementById('btn-open-tab').addEventListener('click', async () => {
    // Extension pages framed inside a web page don't get browser.tabs, so ask the background.
    await browser.runtime.sendMessage({ type: 'openTab', url: panel.url });
    closeGlance();
  });
}

document.getElementById('btn-close').addEventListener('click', closeGlance);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeGlance();
});

init();
