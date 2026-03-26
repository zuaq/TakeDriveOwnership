/* ══════════════════════════════════════════
   App — Main Tauri application logic
   ══════════════════════════════════════════ */

let isRunning = false;

/* ── Tauri API shortcuts ── */
const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;
const { open: dialogOpen, save: dialogSave } = window.__TAURI__.dialog;
const { writeTextFile } = window.__TAURI__.fs;
const { getCurrentWindow } = window.__TAURI__.window;

/* ══════════════════════════════════════════
   Window controls
   ══════════════════════════════════════════ */

function minimizeWindow() { getCurrentWindow().minimize(); }
function maximizeWindow() { getCurrentWindow().toggleMaximize(); }
function closeWindow() { getCurrentWindow().close(); }

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
      document.getElementById('t_folderDesc').style.display = 'none';
    }
  } catch (err) {
    appendLog('Error browsing folder: ' + err, 'danger');
  }
}

function clearFolder() {
  if (isRunning) return;
  document.getElementById('folderPathText').textContent = '';
  document.getElementById('folderPath').style.display = 'none';
  document.getElementById('t_folderDesc').style.display = '';
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

  const t = i18n[lang];
  appendLog('\u25C6 TakeDriveOwnership', 'accent');
  appendLog('  ' + (t.log_started || 'Started') + ' ' + timeStamp(), 'muted');
  appendLog('', 'muted');
  if (folder) {
    appendLog((t.log_target || 'Target') + ': ' + folder, 'muted');
  } else {
    appendLog((t.log_drives || 'Drives') + ': ' + drives.join(', '), 'muted');
  }
  appendLog('', 'muted');

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

  const t = i18n[lang];
  appendLog('\u25C6 TakeDriveOwnership', 'accent');
  appendLog('  ' + (t.log_started || 'Started') + ' ' + timeStamp(), 'muted');
  appendLog('', 'muted');
  appendLog((t.btnQuick || 'Quick Fix'), 'muted');
  if (folder) {
    appendLog((t.log_target || 'Target') + ': ' + folder, 'muted');
  } else {
    appendLog((t.log_drives || 'Drives') + ': ' + drives.join(', '), 'muted');
  }
  appendLog('', 'muted');

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
  document.getElementById('btnFolder').disabled = running;

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

  appendLog('', 'muted');
  appendLog((t.log_done || 'Done!') + ' ' + formatNum(result.fixed || 0) +
    ' \u2014 ' + (elapsed || ''), 'ok');
  appendLog((t.log_finished || 'Finished') + ' ' + timeStamp(), 'muted');
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
  const t = i18n[lang];
  clearLog();
  appendLog('\u2002\u25C6\u2002TakeDriveOwnership', 'accent');
  appendLog('\u2003\u2003\u2003by zuaq', 'muted');
  appendLog('', 'muted');
  appendLog('\u2002' + (t.log_welcome1 || ''), 'muted');
  appendLog('\u2002' + (t.log_welcome2 || ''), 'muted');
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
  applyLang();
  showWelcome();
  loadDrives();
});
