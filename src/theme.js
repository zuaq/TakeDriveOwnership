/* ══════════════════════════════════════════
   Theme — Dark / Light toggle
   ══════════════════════════════════════════ */

let isDark = true;

/**
 * Toggle between dark and light themes
 */
function toggleTheme() {
  isDark = !isDark;
  const win = document.getElementById('appWindow');
  if (win) {
    win.dataset.theme = isDark ? 'dark' : 'light';
  }
  const btn = document.getElementById('themeBtn');
  if (btn) {
    btn.textContent = isDark ? '\u{1F319}' : '\u2600\uFE0F';
  }
}
