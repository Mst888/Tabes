// Preset themes
const THEMES = {
  dark: {
    accentColor: "#7aa2f7",
    bgPrimary: "#1a1b26",
    bgSecondary: "#24283b",
    textColor: "#c0caf5"
  },
  light: {
    accentColor: "#2e7de9",
    bgPrimary: "#f0f0f0",
    bgSecondary: "#ffffff",
    textColor: "#1a1b26"
  },
  "tokyo-night": {
    accentColor: "#7aa2f7",
    bgPrimary: "#1a1b26",
    bgSecondary: "#24283b",
    textColor: "#c0caf5"
  },
  catppuccin: {
    accentColor: "#cba6f7",
    bgPrimary: "#1e1e2e",
    bgSecondary: "#313244",
    textColor: "#cdd6f4"
  },
  nord: {
    accentColor: "#88c0d0",
    bgPrimary: "#2e3440",
    bgSecondary: "#3b4252",
    textColor: "#eceff4"
  },
  dracula: {
    accentColor: "#bd93f9",
    bgPrimary: "#282a36",
    bgSecondary: "#44475a",
    textColor: "#f8f8f2"
  }
};

let currentSettings = null;

async function loadSettings() {
  currentSettings = await browser.runtime.sendMessage({ type: "getSettings" });
  applyToForm(currentSettings);
  updatePreview();
}

function applyToForm(settings) {
  document.getElementById('setting-theme').value = settings.theme;
  document.getElementById('setting-accent').value = settings.accentColor;
  document.getElementById('setting-accent-text').value = settings.accentColor;
  document.getElementById('setting-bg-primary').value = settings.bgPrimary;
  document.getElementById('setting-bg-primary-text').value = settings.bgPrimary;
  document.getElementById('setting-bg-secondary').value = settings.bgSecondary;
  document.getElementById('setting-bg-secondary-text').value = settings.bgSecondary;
  document.getElementById('setting-text-color').value = settings.textColor;
  document.getElementById('setting-text-color-text').value = settings.textColor;
  document.getElementById('setting-icons-position').value = settings.panelIconsPosition;
  document.getElementById('setting-icon-size').value = settings.iconSize;
  document.getElementById('icon-size-value').textContent = settings.iconSize + 'px';
  document.getElementById('setting-font-size').value = settings.fontSize;
  document.getElementById('font-size-value').textContent = settings.fontSize + 'px';
  document.getElementById('setting-border-radius').value = settings.borderRadius;
  document.getElementById('border-radius-value').textContent = settings.borderRadius + 'px';
  document.getElementById('setting-show-header').checked = settings.showHeader;
  document.getElementById('setting-compact').checked = settings.compactMode;
  document.getElementById('setting-custom-css').value = settings.customCSS || '';

  toggleCustomColors(settings.theme === 'custom');
}

function toggleCustomColors(show) {
  const el = document.getElementById('custom-colors');
  el.style.display = show ? 'block' : 'none';
}

function getFormSettings() {
  return {
    theme: document.getElementById('setting-theme').value,
    accentColor: document.getElementById('setting-accent').value,
    bgPrimary: document.getElementById('setting-bg-primary').value,
    bgSecondary: document.getElementById('setting-bg-secondary').value,
    textColor: document.getElementById('setting-text-color').value,
    panelIconsPosition: document.getElementById('setting-icons-position').value,
    iconSize: parseInt(document.getElementById('setting-icon-size').value),
    fontSize: parseInt(document.getElementById('setting-font-size').value),
    borderRadius: parseInt(document.getElementById('setting-border-radius').value),
    showHeader: document.getElementById('setting-show-header').checked,
    compactMode: document.getElementById('setting-compact').checked,
    customCSS: document.getElementById('setting-custom-css').value,
    panelWidth: "100%",
    headerPosition: "top"
  };
}

function updatePreview() {
  const settings = getFormSettings();
  const preview = document.getElementById('preview-sidebar');
  const root = document.documentElement;

  root.style.setProperty('--accent', settings.accentColor);
  root.style.setProperty('--bg-primary', settings.bgPrimary);
  root.style.setProperty('--bg-secondary', settings.bgSecondary);
  root.style.setProperty('--text-primary', settings.textColor);

  preview.style.borderRadius = settings.borderRadius + 'px';
  
  const icons = preview.querySelector('.preview-icons');
  const header = preview.querySelector('.preview-header');
  
  header.style.display = settings.showHeader ? 'flex' : 'none';
  
  preview.querySelectorAll('.preview-icon:not(.add)').forEach(icon => {
    icon.style.width = Math.min(settings.iconSize * 0.67, 32) + 'px';
    icon.style.height = Math.min(settings.iconSize * 0.67, 32) + 'px';
    icon.style.borderRadius = Math.min(settings.borderRadius, 6) + 'px';
  });
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Event listeners
document.addEventListener('DOMContentLoaded', loadSettings);

// Theme selector
document.getElementById('setting-theme').addEventListener('change', (e) => {
  const theme = e.target.value;
  toggleCustomColors(theme === 'custom');
  
  if (theme !== 'custom' && THEMES[theme]) {
    const colors = THEMES[theme];
    document.getElementById('setting-accent').value = colors.accentColor;
    document.getElementById('setting-accent-text').value = colors.accentColor;
    document.getElementById('setting-bg-primary').value = colors.bgPrimary;
    document.getElementById('setting-bg-primary-text').value = colors.bgPrimary;
    document.getElementById('setting-bg-secondary').value = colors.bgSecondary;
    document.getElementById('setting-bg-secondary-text').value = colors.bgSecondary;
    document.getElementById('setting-text-color').value = colors.textColor;
    document.getElementById('setting-text-color-text').value = colors.textColor;
  }
  updatePreview();
});

// Sync color picker and text input
['accent', 'bg-primary', 'bg-secondary', 'text-color'].forEach(name => {
  const colorInput = document.getElementById(`setting-${name}`);
  const textInput = document.getElementById(`setting-${name}-text`);
  
  colorInput.addEventListener('input', () => {
    textInput.value = colorInput.value;
    updatePreview();
  });
  
  textInput.addEventListener('input', () => {
    if (/^#[0-9a-f]{6}$/i.test(textInput.value)) {
      colorInput.value = textInput.value;
      updatePreview();
    }
  });
});

// Range sliders
document.getElementById('setting-icon-size').addEventListener('input', (e) => {
  document.getElementById('icon-size-value').textContent = e.target.value + 'px';
  updatePreview();
});

document.getElementById('setting-font-size').addEventListener('input', (e) => {
  document.getElementById('font-size-value').textContent = e.target.value + 'px';
  updatePreview();
});

document.getElementById('setting-border-radius').addEventListener('input', (e) => {
  document.getElementById('border-radius-value').textContent = e.target.value + 'px';
  updatePreview();
});

// Toggles
document.getElementById('setting-show-header').addEventListener('change', updatePreview);
document.getElementById('setting-compact').addEventListener('change', updatePreview);
document.getElementById('setting-icons-position').addEventListener('change', updatePreview);

// Save
document.getElementById('btn-save').addEventListener('click', async () => {
  const settings = getFormSettings();
  await browser.runtime.sendMessage({ type: "updateSettings", settings });
  currentSettings = settings;
  showToast('Settings saved!');
});

// Reset
document.getElementById('btn-reset').addEventListener('click', async () => {
  if (!confirm('Reset all settings to default?')) return;
  const settings = await browser.runtime.sendMessage({ type: "resetSettings" });
  currentSettings = settings;
  applyToForm(settings);
  updatePreview();
  showToast('Settings reset to default');
});

// Export
document.getElementById('btn-export').addEventListener('click', () => {
  const settings = getFormSettings();
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tabes-settings.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Settings exported');
});

// Import
document.getElementById('btn-import').addEventListener('click', () => {
  document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const settings = JSON.parse(text);
    await browser.runtime.sendMessage({ type: "updateSettings", settings });
    currentSettings = settings;
    applyToForm(settings);
    updatePreview();
    showToast('Settings imported!');
  } catch (err) {
    alert('Invalid settings file');
  }
  e.target.value = '';
});
