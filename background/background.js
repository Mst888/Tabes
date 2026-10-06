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
const GOOGLE_FAVICON_SERVICE = "https://www.google.com/s2/favicons";

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
// The site's own /favicon.ico; unlike a third-party favicon service it doesn't
// tell anyone else which sites the user keeps as panels.
function defaultIcon(url) {
  return `${new URL(url).origin}/favicon.ico`;
}

browser.runtime.onInstalled.addListener(async () => {
  const data = await browser.storage.local.get(["panels", "settings"]);
  if (!Array.isArray(data.panels)) {
    await browser.storage.local.set({ panels: DEFAULT_PANELS });
  } else if (data.panels.some(p => (p.icon || '').startsWith(GOOGLE_FAVICON_SERVICE))) {
    const panels = data.panels.map(p =>
      (p.icon || '').startsWith(GOOGLE_FAVICON_SERVICE) ? { ...p, icon: defaultIcon(p.url) } : p
    );
    await browser.storage.local.set({ panels });
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
          icon: message.icon || defaultIcon(message.url),
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

    case "setFloat":
      return setFloatEnabled(message.enabled);

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

// Moves the active panel and tells an open sidebar to show it; a sidebar that
// opens afterwards loads the stored active panel on its own.
async function switchPanel(delta) {
  const data = await browser.storage.local.get(["panels", "activePanel"]);
  const panels = data.panels || DEFAULT_PANELS;
  if (!panels.length) return;
  const index = panels.findIndex(p => p.id === data.activePanel);
  const next = index === -1
    ? panels[delta > 0 ? 0 : panels.length - 1]
    : panels[(index + delta + panels.length) % panels.length];
  await browser.storage.local.set({ activePanel: next.id });
  browser.runtime.sendMessage({ type: "showPanel", id: next.id }).catch(() => {});
}

// --- Floating bar: dock + panel window drawn over every page (float/float-content.js) ---

const FLOAT_SCRIPTS = ["/common/theme.js", "/float/float-content.js"];
let floatRegistration = null;
let floatSync = Promise.resolve();

async function applyFloatScripts() {
  const { float } = await browser.storage.local.get("float");
  const enabled = !!(float && float.enabled) &&
    await browser.permissions.contains({ origins: ["<all_urls>"] });

  if (enabled && !floatRegistration) {
    floatRegistration = await browser.contentScripts.register({
      matches: ["<all_urls>"],
      js: FLOAT_SCRIPTS.map(file => ({ file })),
      runAt: "document_idle"
    });
    // Registered scripts only run on future loads; add the bar to already open tabs too.
    const tabs = await browser.tabs.query({ url: ["http://*/*", "https://*/*"] });
    await Promise.all(tabs.map(async tab => {
      try {
        for (const file of FLOAT_SCRIPTS) await browser.tabs.executeScript(tab.id, { file });
      } catch (e) {
        // Pages extensions can't script (e.g. addons.mozilla.org)
      }
    }));
  } else if (!enabled && floatRegistration) {
    await floatRegistration.unregister();
    floatRegistration = null;
  }
  return enabled;
}

function syncFloat() {
  floatSync = floatSync.then(applyFloatScripts, applyFloatScripts);
  return floatSync;
}

// Content scripts read "enabled" from storage and remove the bar when it turns off.
async function setFloatEnabled(enabled) {
  const { float } = await browser.storage.local.get("float");
  await browser.storage.local.set({ float: { ...(float || {}), enabled: !!enabled } });
  return syncFloat();
}

browser.storage.onChanged.addListener(changes => {
  if (!changes.float) return;
  const was = !!(changes.float.oldValue && changes.float.oldValue.enabled);
  const now = !!(changes.float.newValue && changes.float.newValue.enabled);
  if (was !== now) syncFloat();
});
browser.permissions.onAdded.addListener(syncFloat);
browser.permissions.onRemoved.addListener(syncFloat);
syncFloat();

browser.commands.onCommand.addListener(command => {
  if (command === "open-glance") openGlance();
  if (command === "toggle-float") {
    // permissions.request only works synchronously inside the user action.
    const granted = browser.permissions.request({ origins: ["<all_urls>"] });
    Promise.all([granted, browser.storage.local.get("float")])
      .then(([ok, { float }]) => ok && setFloatEnabled(!(float && float.enabled)))
      .catch(() => {});
  }
  if (command === "next-panel" || command === "previous-panel") {
    // sidebarAction.open() only works synchronously inside the user action.
    browser.sidebarAction.open().catch(() => {});
    switchPanel(command === "next-panel" ? 1 : -1);
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
