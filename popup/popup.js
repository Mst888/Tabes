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

    const icon = panel.icon
      ? `<img src="${panel.icon}" alt="" onerror="this.outerHTML='<span class=\\'fallback-icon\\'>${panel.title.charAt(0)}</span>'">`
      : `<span class="fallback-icon">${panel.title.charAt(0)}</span>`;

    item.innerHTML = `
      ${icon}
      <div class="panel-item-info">
        <div class="panel-item-title">${panel.title}</div>
        <div class="panel-item-url">${panel.url}</div>
      </div>
      <button class="panel-item-remove" title="Remove">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    `;

    item.querySelector('.panel-item-remove').addEventListener('click', async (e) => {
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
    if (tabs[0]) {
      const tab = tabs[0];
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
