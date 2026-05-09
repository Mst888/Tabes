// Default UI settings
const DEFAULT_SETTINGS = {
  theme: "dark", // dark, light, auto
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

// Initialize storage with defaults if empty
browser.runtime.onInstalled.addListener(async () => {
  const data = await browser.storage.local.get(["panels", "settings"]);
  if (!data.panels || data.panels.length === 0) {
    await browser.storage.local.set({ panels: DEFAULT_PANELS });
  }
  if (!data.settings) {
    await browser.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
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
      return browser.storage.local.get("settings").then(data => data.settings || DEFAULT_SETTINGS);

    case "updateSettings":
      return browser.storage.local.get("settings").then(data => {
        const settings = { ...(data.settings || DEFAULT_SETTINGS), ...message.settings };
        return browser.storage.local.set({ settings }).then(() => settings);
      });

    case "resetSettings":
      return browser.storage.local.set({ settings: DEFAULT_SETTINGS }).then(() => DEFAULT_SETTINGS);

    default:
      return Promise.resolve(null);
  }
});
