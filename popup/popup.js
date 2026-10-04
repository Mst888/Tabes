document.addEventListener('DOMContentLoaded', async () => {
  await loadPanels();

  document.getElementById('btn-add-current').addEventListener('click', addCurrentPage);
  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('btn-open-sidebar').addEventListener('click', openSidebar);
});

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
        icon: tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${new URL(tab.url).hostname}&sz=32`
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
