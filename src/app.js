/* ══════════════════════════════════════════
   App — Main Tauri application logic
   ══════════════════════════════════════════ */

let isRunning = false;

/* ── Tauri API (safe access with multiple fallback paths) ── */
const T = window.__TAURI__ || {};
const invoke = T.core ? T.core.invoke : async () => { console.warn('invoke N/A'); };
const listen = T.event ? T.event.listen : async () => () => {};

/* ── Window controls ── */
function minimizeWindow() { invoke('win_minimize').catch(() => {}); }
function maximizeWindow() { invoke('win_maximize').catch(() => {}); }
function closeWindow() { invoke('win_close').catch(() => {}); }

/* ── Open external URL ── */
async function openExternal(url) {
  try { await invoke('plugin:opener|open_url', { url }); return; } catch(e) {}
  try { await invoke('plugin:shell|open', { path: url }); return; } catch(e) {}
  window.open(url, '_blank');
}

/* ── Dialog ── */
async function dialogOpen(opts) {
  if (T.dialog && T.dialog.open) return T.dialog.open(opts);
  try { return await invoke('plugin:dialog|open', opts); } catch(e) { return null; }
}
async function dialogSave(opts) {
  if (T.dialog && T.dialog.save) return T.dialog.save(opts);
  try { return await invoke('plugin:dialog|save', opts); } catch(e) { return null; }
}
async function writeTextFile(path, contents) {
  if (T.fs && T.fs.writeTextFile) return T.fs.writeTextFile(path, contents);
  try { return await invoke('plugin:fs|write_text_file', { path, contents }); } catch(e) {}
}

/* ══════════════════════════════════════════
   Help overlay
   ══════════════════════════════════════════ */

function toggleHelp() {
  const overlay = document.getElementById('helpOverlay');
  if (overlay.style.display === 'none') {
    const t = i18n[lang];
    document.getElementById('t_helpTitle').textContent = t.helpTitle;
    document.getElementById('helpBody').innerHTML = t.help;
    overlay.style.display = 'flex';
  } else {
    overlay.style.display = 'none';
  }
}

/* ══════════════════════════════════════════
   Drive cards
   ══════════════════════════════════════════ */

async function loadDrives() {
  try {
    const drives = await invoke('get_drives');
    renderDriveCards(drives);
  } catch (err) {
    appendLog('Error loading drives: ' + err, 'danger');
  }
}

function renderDriveCards(drives) {
  const row = document.getElementById('drivesRow');
  row.innerHTML = '';
  drives.forEach(d => {
    const card = document.createElement('div');
    card.className = 'drive-card';
    card.onclick = function() { toggleDrive(this); };
    const checked = (d.letter !== 'C:') ? 'checked' : '';
    card.innerHTML =
      '<div class="dc-top">' +
        '<input type="checkbox" ' + checked + '>' +
        '<span class="dc-letter">' + escapeHtml(d.letter) + '</span>' +
        '<span class="dc-name">' + escapeHtml(d.label) + '</span>' +
      '</div>' +
      '<span class="dc-cap">' + (d.free_gb || 0).toFixed(1) + ' / ' + (d.total_gb || 0).toFixed(1) + ' GB free</span>';
    row.appendChild(card);
  });
}

function toggleDrive(card) {
  if (card.classList.contains('disabled')) return;
  const cb = card.querySelector('input[type="checkbox"]');
  if (cb) cb.checked = !cb.checked;
}

/* ══════════════════════════════════════════
   Folder browse
   ══════════════════════════════════════════ */

async function browseFolder() {
  if (isRunning) return;
  try {
    const selected = await dialogOpen({ directory: true, multiple: false });
    if (selected) {
      document.getElementById('folderPathText').textContent = selected;
      document.getElementById('folderPath').style.display = 'flex';
      document.getElementById('btnFolder').style.display = 'none';
      setDrivesDisabled(true);
    }
  } catch (err) {
    appendLog('Error browsing folder: ' + err, 'danger');
  }
}

function clearFolder() {
  if (isRunning) return;
  document.getElementById('folderPathText').textContent = '';
  document.getElementById('folderPath').style.display = 'none';
  document.getElementById('btnFolder').style.display = '';
  setDrivesDisabled(false);
}

function setDrivesDisabled(disabled) {
  document.querySelectorAll('.drive-card').forEach(c => {
    c.classList.toggle('disabled', disabled);
    const cb = c.querySelector('input[type="checkbox"]');
    if (cb) cb.disabled = disabled;
  });
  const label = document.getElementById('drivesLabel');
  if (label) label.style.opacity = disabled ? '0.4' : '1';
}

/* ══════════════════════════════════════════
   Get current selections
   ══════════════════════════════════════════ */

function getSelectedDrives() {
  const drives = [];
  document.querySelectorAll('.drive-card').forEach(card => {
    const cb = card.querySelector('input[type="checkbox"]');
    if (cb && cb.checked) {
      const letter = card.querySelector('.dc-letter');
      if (letter) drives.push(letter.textContent.trim());
    }
  });
  return drives;
}

function getFolderPath() {
  return document.getElementById('folderPathText').textContent || '';
}

function getTarget() {
  // If folder is selected, use folder mode; otherwise use drives
  const folder = getFolderPath();
  if (folder) {
    return { mode: 'fix_folder', drives: [], folder };
  }
  const drives = getSelectedDrives();
  return { mode: null, drives, folder: '' };
}

/* ══════════════════════════════════════════
   Start (Scan & Fix)
   ══════════════════════════════════════════ */

async function startFix() {
  if (isRunning) return;

  const target = getTarget();
  const mode = target.folder ? 'fix_folder' : 'scan_fix';
  const drives = target.drives;
  const folder = target.folder;

  if (!folder && drives.length === 0) {
    appendLog(L('noTarget'), 'warn');
    return;
  }

  updateUIRunning(true);
  clearStats();
  clearLog();

  appendLog('Scan & Fix \u2014 ' + (folder || drives.join(', ')), 'accent');

  const unlisten = await listen('fix-progress', (event) => {
    updateProgress(event.payload);
    if (event.payload.message) {
      appendLog(event.payload.message, event.payload.log_type || 'muted');
    }
  });

  try {
    const result = await invoke('run_fix', { mode, drives, folder });
    showResult(result);
  } catch (err) {
    appendLog('Error: ' + err, 'danger');
  } finally {
    unlisten();
    updateUIRunning(false);
  }
}

/* ══════════════════════════════════════════
   Quick Fix
   ══════════════════════════════════════════ */

async function quickFix() {
  if (isRunning) return;

  const target = getTarget();
  const drives = target.folder ? [] : target.drives;
  const folder = target.folder;

  if (!folder && drives.length === 0) {
    appendLog(L('noTarget'), 'warn');
    return;
  }

  updateUIRunning(true);
  clearStats();
  clearLog();

  appendLog('Quick Fix \u2014 ' + (folder || drives.join(', ')), 'accent');

  const unlisten = await listen('fix-progress', (event) => {
    updateProgress(event.payload);
    if (event.payload.message) {
      appendLog(event.payload.message, event.payload.log_type || 'muted');
    }
  });

  try {
    const result = await invoke('run_fix', {
      mode: folder ? 'fix_folder' : 'quick_fix',
      drives,
      folder
    });
    showResult(result);
  } catch (err) {
    appendLog('Error: ' + err, 'danger');
  } finally {
    unlisten();
    updateUIRunning(false);
  }
}

/* ══════════════════════════════════════════
   UI state management
   ══════════════════════════════════════════ */

function updateUIRunning(running) {
  isRunning = running;
  const t = i18n[lang];
  document.getElementById('btnQuick').disabled = running;
  document.getElementById('btnStart').disabled = running;

  if (running) {
    document.getElementById('btnStart').textContent = t.btnRunning;
    document.getElementById('pBar').classList.add('marquee');
  } else {
    document.getElementById('btnQuick').textContent = t.btnQuick;
    document.getElementById('btnStart').textContent = t.btnStart;
    document.getElementById('pBar').classList.remove('marquee');
  }
}

function clearStats() {
  document.getElementById('sScanned').textContent = '0';
  document.getElementById('sIssues').textContent = '0';
  document.getElementById('sFixed').textContent = '0';
  document.getElementById('sFailed').textContent = '0';
  document.getElementById('pFill').style.width = '0%';
  document.getElementById('pText').textContent = L('ready');
}

/* ══════════════════════════════════════════
   Progress & results
   ══════════════════════════════════════════ */

function updateProgress(payload) {
  if (payload.scanned !== undefined)
    document.getElementById('sScanned').textContent = formatNum(payload.scanned);
  if (payload.issues !== undefined)
    document.getElementById('sIssues').textContent = formatNum(payload.issues);
  if (payload.fixed !== undefined)
    document.getElementById('sFixed').textContent = formatNum(payload.fixed);
  if (payload.failed !== undefined)
    document.getElementById('sFailed').textContent = formatNum(payload.failed);
  if (payload.percent !== undefined) {
    document.getElementById('pBar').classList.remove('marquee');
    document.getElementById('pFill').style.width = payload.percent + '%';
  }
  if (payload.progress_text !== undefined)
    document.getElementById('pText').textContent = payload.progress_text;
}

function showResult(result) {
  const t = i18n[lang];
  if (!result) return;

  if (result.scanned !== undefined)
    document.getElementById('sScanned').textContent = formatNum(result.scanned);
  if (result.issues !== undefined)
    document.getElementById('sIssues').textContent = formatNum(result.issues);
  if (result.fixed !== undefined)
    document.getElementById('sFixed').textContent = formatNum(result.fixed);
  if (result.failed !== undefined)
    document.getElementById('sFailed').textContent = formatNum(result.failed);

  document.getElementById('pFill').style.width = '100%';
  document.getElementById('pBar').classList.remove('marquee');

  const elapsed = result.elapsed || '';
  document.getElementById('pText').textContent =
    (t.done_pt || 'Done') + '  ' + (t.statFixed || 'Fixed') + ': ' + formatNum(result.fixed || 0) +
    '   ' + (t.statFailed || 'Failed') + ': ' + formatNum(result.failed || 0) +
    (elapsed ? '   (' + elapsed + ')' : '');

  const fixed = formatNum(result.fixed || 0);
  const failed = result.failed || 0;
  appendLog('', 'muted');
  if (failed === 0) {
    appendLog('\u2713 Done \u2014 ' + fixed + ' fixed' + (elapsed ? ' (' + elapsed + ')' : ''), 'ok');
  } else {
    appendLog('\u2713 Done \u2014 ' + fixed + ' fixed, ' + failed + ' failed' + (elapsed ? ' (' + elapsed + ')' : ''), 'warn');
  }
}

/* ══════════════════════════════════════════
   Log area
   ══════════════════════════════════════════ */

function appendLog(msg, type) {
  type = type || 'muted';
  const area = document.getElementById('logArea');
  const div = document.createElement('div');
  div.className = 'log-' + type;
  div.textContent = msg;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function clearLog() {
  document.getElementById('logArea').innerHTML = '';
}

function showWelcome() {
  // Log area starts empty — shows content only when user runs a fix
}

/* ══════════════════════════════════════════
   Export log
   ══════════════════════════════════════════ */

async function exportLog() {
  try {
    const path = await dialogSave({
      filters: [{ name: 'Text', extensions: ['txt'] }],
      defaultPath: 'fix-log-' + dateStamp() + '.txt'
    });
    if (path) {
      const text = document.getElementById('logArea').innerText;
      await writeTextFile(path, text);
      appendLog('Log exported to: ' + path, 'ok');
    }
  } catch (err) {
    appendLog('Export error: ' + err, 'danger');
  }
}

/* ══════════════════════════════════════════
   Utilities
   ══════════════════════════════════════════ */

function formatNum(n) { return Number(n).toLocaleString(); }

function dateStamp() {
  const d = new Date();
  return d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') + '-' +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') +
    String(d.getSeconds()).padStart(2, '0');
}

function timeStamp() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0') + ' ' +
    String(d.getDate()).padStart(2, '0') + '/' +
    String(d.getMonth() + 1).padStart(2, '0') + '/' +
    d.getFullYear();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ══════════════════════════════════════════
   Init
   ══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Window controls
  document.getElementById('winMin').addEventListener('click', minimizeWindow);
  document.getElementById('winMax').addEventListener('click', maximizeWindow);
  document.getElementById('winClose').addEventListener('click', closeWindow);

  // Title bar buttons
  document.getElementById('helpBtn').addEventListener('click', toggleHelp);
  document.getElementById('langBtn').addEventListener('click', toggleLang);
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);

  // Action buttons
  document.getElementById('btnQuick').addEventListener('click', quickFix);
  document.getElementById('btnStart').addEventListener('click', startFix);
  document.getElementById('btnFolder').addEventListener('click', browseFolder);
  document.getElementById('folderClearBtn').addEventListener('click', clearFolder);
  document.getElementById('btnExport').addEventListener('click', exportLog);

  // Coffee / external links
  document.getElementById('coffeeBtn').addEventListener('click', function() {
    openExternal('https://buymeacoffee.com/zuaq');
  });

  // Help overlay
  document.getElementById('helpOverlay').addEventListener('click', toggleHelp);
  document.getElementById('helpPanel').addEventListener('click', function(e) { e.stopPropagation(); });
  document.getElementById('helpClose').addEventListener('click', toggleHelp);

  applyLang();
  showWelcome();
  loadDrives();
});
