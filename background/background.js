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

// --- Web panel request handling ---
// Only requests made from inside a Tabes panel iframe are touched; normal browsing is left alone.

const EXTENSION_ORIGIN = browser.runtime.getURL("");
const MOBILE_USER_AGENT = "Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0";

let cachedPanels = [];
browser.storage.local.get("panels").then(data => {
  cachedPanels = data.panels || DEFAULT_PANELS;
});
browser.storage.onChanged.addListener(changes => {
  if (changes.panels) cachedPanels = changes.panels.newValue || [];
});

// Frames (keyed by tabId:frameId) whose current panel uses the mobile user agent.
const mobileFrames = new Set();

function isPanelRequest(details) {
  return (details.frameAncestors || []).some(a => a.url && a.url.startsWith(EXTENSION_ORIGIN));
}

function normalizeUrl(url) {
  try {
    return new URL(url).href;
  } catch {
    return url;
  }
}

function useMobileUserAgent(details) {
  const key = `${details.tabId}:${details.frameId}`;
  if (details.type === "sub_frame") {
    // A panel being (re)opened loads its configured URL; other sub_frame loads are in-panel navigations.
    const url = normalizeUrl(details.url);
    const panel = cachedPanels.find(p => normalizeUrl(p.url) === url);
    if (panel) {
      if (panel.useragent) mobileFrames.add(key);
      else mobileFrames.delete(key);
    }
  }
  return mobileFrames.has(key);
}

browser.webRequest.onBeforeSendHeaders.addListener(
  details => {
    if (!isPanelRequest(details) || !useMobileUserAgent(details)) return {};
    const requestHeaders = details.requestHeaders.map(h =>
      h.name.toLowerCase() === "user-agent" ? { name: h.name, value: MOBILE_USER_AGENT } : h
    );
    return { requestHeaders };
  },
  { urls: ["<all_urls>"] },
  ["blocking", "requestHeaders"]
);

function stripFrameAncestors(csp) {
  return csp
    .split(";")
    .filter(directive => !/^\s*frame-ancestors(\s|$)/i.test(directive))
    .join(";");
}

browser.webRequest.onHeadersReceived.addListener(
  details => {
    if (!isPanelRequest(details)) return {};
    const responseHeaders = [];
    for (const header of details.responseHeaders) {
      const name = header.name.toLowerCase();
      if (name === "x-frame-options") continue;
      if (name === "content-security-policy") {
        const value = stripFrameAncestors(header.value || "");
        if (value.trim()) responseHeaders.push({ name: header.name, value });
        continue;
      }
      responseHeaders.push(header);
    }
    return { responseHeaders };
  },
  { urls: ["<all_urls>"], types: ["sub_frame"] },
  ["blocking", "responseHeaders"]
);
