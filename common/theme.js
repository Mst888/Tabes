// Applies the user's colors to a page, deriving the secondary shades
// (hover, border, muted text, ...) so every theme, light or dark, stays consistent.
function mixHexColors(a, b, weight) {
  const parse = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const ca = parse(a);
  const cb = parse(b);
  if (ca.some(Number.isNaN) || cb.some(Number.isNaN)) return a;
  return '#' + ca
    .map((v, i) => Math.round(v + (cb[i] - v) * weight).toString(16).padStart(2, '0'))
    .join('');
}

function applyTabesTheme(settings, root = document.documentElement) {
  if (!settings) return;
  const { bgPrimary, bgSecondary, textColor, accentColor } = settings;
  const vars = {
    '--bg-primary': bgPrimary,
    '--bg-secondary': bgSecondary,
    '--bg-tertiary': mixHexColors(bgSecondary, textColor, 0.08),
    '--bg-hover': mixHexColors(bgSecondary, textColor, 0.16),
    '--border': mixHexColors(bgSecondary, textColor, 0.16),
    '--text-primary': textColor,
    '--text-secondary': mixHexColors(textColor, bgPrimary, 0.15),
    '--text-muted': mixHexColors(textColor, bgPrimary, 0.55),
    '--accent': accentColor,
    '--accent-hover': mixHexColors(accentColor, textColor, 0.15)
  };
  for (const [name, value] of Object.entries(vars)) {
    if (value) root.style.setProperty(name, value);
  }
}
