document.addEventListener('DOMContentLoaded', async () => {
  browser.runtime.sendMessage({ type: "getSettings" }).then(settings => applyTabesTheme(settings));
  await loadPanels();

  document.getElementById('btn-add-current').addEventListener('click', addCurrentPage);
  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('btn-open-sidebar').addEventListener('click', openSidebar);
  document.getElementById('btn-float').addEventListener('click', toggleFloat);
  showFloatState();
});

async function showFloatState() {
  const [{ float }, permitted] = await Promise.all([
    browser.storage.local.get('float'),
    browser.permissions.contains({ origins: ['<all_urls>'] })
  ]);
  const on = !!(float && float.enabled) && permitted;
  const btn = document.getElementById('btn-float');
  btn.dataset.on = on;
  btn.textContent = `Floating Bar: ${on ? 'On' : 'Off'}`;
}

// The permission prompt can close the popup before its promise settles, so the
// new state is sent right away; the background applies it once access is granted.
function toggleFloat() {
  const enable = document.getElementById('btn-float').dataset.on !== 'true';
  if (enable) browser.permissions.request({ origins: ['<all_urls>'] }).catch(() => {});
  browser.runtime.sendMessage({ type: 'setFloat', enabled: enable }).then(() => window.close());
}

async function loadPanels() {
  const panels = await browser.runtime.sendMessage({ type: "getPanels" });
  const list = document.getElementById('panels-list');
  list.innerHTML = '';

  if (!panels || panels.length === 0) {
    list.innerHTML = '<div class="empty-state">No panels yet. Add one!</div>';
    return;
  }

  panels.forEach(panel => {
    const item = document.createElement('div');
    item.className = 'panel-item';

    const createFallback = () => {
      const span = document.createElement('span');
      span.className = 'fallback-icon';
      span.textContent = (panel.title || '?').charAt(0);
      return span;
    };

    if (panel.icon) {
      const img = document.createElement('img');
      img.src = panel.icon;
      img.alt = '';
      img.addEventListener('error', () => img.replaceWith(createFallback()));
      item.appendChild(img);
    } else {
      item.appendChild(createFallback());
    }

    const info = document.createElement('div');
    info.className = 'panel-item-info';
    const title = document.createElement('div');
    title.className = 'panel-item-title';
    title.textContent = panel.title;
    const url = document.createElement('div');
    url.className = 'panel-item-url';
    url.textContent = panel.url;
    info.append(title, url);
    item.appendChild(info);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'panel-item-remove';
    removeBtn.title = 'Remove';
    removeBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `;
    item.appendChild(removeBtn);

    item.title = 'Open as Glance';
    item.addEventListener('click', () => {
      browser.runtime.sendMessage({ type: "openGlance", id: panel.id })
        .finally(() => window.close());
    });

    removeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await browser.runtime.sendMessage({ type: "removePanel", id: panel.id });
      loadPanels();
    });

    list.appendChild(item);
  });
}

async function addCurrentPage() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab && /^https?:\/\//i.test(tab.url)) {
      await browser.runtime.sendMessage({
        type: "addPanel",
        url: tab.url,
        title: tab.title,
        icon: tab.favIconUrl
      });
      loadPanels();
    }
  } catch (err) {
    console.error('Failed to add current page:', err);
  }
}

function openSettings() {
  browser.runtime.openOptionsPage();
  window.close();
}

function openSidebar() {
  browser.sidebarAction.open();
  window.close();
}
