// Default UI settings
const DEFAULT_SETTINGS = {
  theme: "dark", // dark, light, tokyo-night, catppuccin, nord, dracula, custom
  accentColor: "#7aa2f7",
  bgPrimary: "#1a1b26",
  bgSecondary: "#24283b",
  textColor: "#c0caf5",
  iconSize: 36, // px
  panelIconsPosition: "top", // top, left, bottom, right
  fontSize: 13, // px
  borderRadius: 8, // px
  showHeader: true,
  headerPosition: "top", // top, bottom
  compactMode: false,
  panelWidth: "100%",
  customCSS: ""
};

// Default panels (same as old Zen Browser defaults)
const DEFAULT_PANELS = [
  {
    id: "p1",
    url: "https://www.wikipedia.org/",
    title: "Wikipedia",
    icon: "https://www.wikipedia.org/favicon.ico",
    useragent: false
  },
  {
    id: "p2",
    url: "https://m.twitter.com/",
    title: "Twitter/X",
    icon: "https://twitter.com/favicon.ico",
    useragent: true
  },
  {
    id: "p3",
    url: "https://www.youtube.com/",
    title: "YouTube",
    icon: "https://www.youtube.com/favicon.ico",
    useragent: true
  },
  {
    id: "p4",
    url: "https://translate.google.com/",
    title: "Google Translate",
    icon: "https://translate.google.com/favicon.ico",
    useragent: false
  }
];

function withDefaultSettings(settings) {
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
}

// Initialize storage with defaults on first install, and fill in settings
// keys added by newer versions. A user's empty panel list is kept on update.
browser.runtime.onInstalled.addListener(async () => {
  const data = await browser.storage.local.get(["panels", "settings"]);
  if (!Array.isArray(data.panels)) {
    await browser.storage.local.set({ panels: DEFAULT_PANELS });
  }
  await browser.storage.local.set({ settings: withDefaultSettings(data.settings) });
});

// Handle messages from sidebar and popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "getPanels":
      return browser.storage.local.get("panels").then(data => data.panels || DEFAULT_PANELS);

    case "addPanel":
      return browser.storage.local.get("panels").then(data => {
        const panels = data.panels || [];
        const newPanel = {
          id: "p" + Date.now(),
          url: message.url,
          title: message.title || new URL(message.url).hostname,
          icon: message.icon || `https://www.google.com/s2/favicons?domain=${new URL(message.url).hostname}&sz=32`,
          useragent: message.useragent || false
        };
        panels.push(newPanel);
        return browser.storage.local.set({ panels }).then(() => newPanel);
      });

    case "removePanel":
      return browser.storage.local.get("panels").then(data => {
        const panels = (data.panels || []).filter(p => p.id !== message.id);
        return browser.storage.local.set({ panels }).then(() => panels);
      });

    case "updatePanel":
      return browser.storage.local.get("panels").then(data => {
        const panels = data.panels || [];
        const index = panels.findIndex(p => p.id === message.id);
        if (index !== -1) {
          panels[index] = { ...panels[index], ...message.updates };
        }
        return browser.storage.local.set({ panels }).then(() => panels);
      });

    case "reorderPanels":
      return browser.storage.local.set({ panels: message.panels }).then(() => message.panels);

    case "getActivePanel":
      return browser.storage.local.get("activePanel").then(data => data.activePanel || null);

    case "setActivePanel":
      return browser.storage.local.set({ activePanel: message.id });

    case "getSettings":
      return browser.storage.local.get("settings").then(data => withDefaultSettings(data.settings));

    case "updateSettings":
      return browser.storage.local.get("settings").then(data => {
        const settings = { ...withDefaultSettings(data.settings), ...message.settings };
        return browser.storage.local.set({ settings }).then(() => settings);
      });

    case "openTab":
      if (!/^https?:\/\//i.test(message.url || '')) return Promise.resolve(false);
      return browser.tabs.create({ url: message.url }).then(() => true);

    case "closeGlance":
      if (!sender.tab) return Promise.resolve(false);
      return browser.tabs.sendMessage(sender.tab.id, { type: "tabesCloseGlance" }).then(() => true, () => false);

    case "openGlance":
      return openGlance(message.id, message.tabId);

    case "resetSettings":
      return browser.storage.local.set({ settings: DEFAULT_SETTINGS }).then(() => DEFAULT_SETTINGS);

    default:
      return Promise.resolve(null);
  }
});

// --- Glance: show a panel as a floating overlay on top of the current page ---

function glanceUrl(panelId, inWindow) {
  const params = new URLSearchParams({ id: panelId });
  if (inWindow) params.set("window", "1");
  return browser.runtime.getURL(`glance/glance.html?${params}`);
}

async function openGlance(panelId, tabId) {
  const data = await browser.storage.local.get(["panels", "activePanel", "lastGlancePanel"]);
  const panels = data.panels || DEFAULT_PANELS;
  const panel = panels.find(p => p.id === (panelId || data.lastGlancePanel || data.activePanel)) || panels[0];
  if (!panel) return false;
  await browser.storage.local.set({ lastGlancePanel: panel.id });

  if (tabId == null) {
    const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    tabId = tab && tab.id;
  }

  try {
    // Fails on pages extensions can't script (about:, addons.mozilla.org, ...) or without host access.
    await browser.tabs.executeScript(tabId, { file: "/glance/glance-content.js" });
    await browser.tabs.sendMessage(tabId, { type: "tabesShowGlance", url: glanceUrl(panel.id, false) });
    return true;
  } catch (e) {
    await browser.windows.create({ url: glanceUrl(panel.id, true), type: "popup", width: 520, height: 800 });
    return false;
  }
}

browser.commands.onCommand.addListener(command => {
  if (command === "open-glance") openGlance();
});
