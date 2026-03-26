/* ══════════════════════════════════════════
   i18n — English / Thai
   ══════════════════════════════════════════ */

let lang = 'en';

const i18n = {
  en: {
    selectTarget:   'SELECT TARGET',
    folderBtn:      'Fix Specific Folder',
    folderDesc:     'Pick a specific folder to fix',
    quickDesc:      'Fix everything in one pass \u2014 fastest',
    startDesc:      'Scan first, then fix with detailed report',
    step1:          'Take file ownership',
    step2:          'Grant full access',
    step3:          'Remove read-only lock',
    step4:          'Unblock files from other PC',
    results:        'RESULTS',
    export:         'Export Log',
    statScanned:    'SCANNED',
    statIssues:     'ISSUES',
    statFixed:      'FIXED',
    statFailed:     'FAILED',
    ready:          'Ready.',
    noTarget:       'Please select a drive or choose a folder.',
    btnQuick:       '\u26A1\u2002QUICK FIX',
    btnStart:       '\u25B8\u2002SCAN & FIX',
    btnRunning:     '\u25B8\u2002RUNNING...',
    scanning_pt:    'Scanning \u2014 please wait...',
    done_pt:        'Done.',
    log_welcome1:   'Select drives or a folder, then click Start.',
    log_welcome2:   'Use Quick Fix for the fastest single-pass fix.',
    log_target:     'Target',
    log_drives:     'Drives',
    log_done:       'Done!',
    log_started:    'Started',
    log_finished:   'Finished',
    helpTitle:      'About This Program',
    help: `
<h3>WHAT IS THIS?</h3>
<p>Fixes file permission problems when you move a hard drive from one Windows PC to another.</p>
<p class="h-muted">Common symptoms: can't open/save files, Excel opens read-only, "Access Denied" errors, files blocked by Windows.</p>

<h3>WHAT CAUSES THE PROBLEM?</h3>
<table>
  <tr><th>CAUSE</th><th>WHAT HAPPENS</th></tr>
  <tr><td>Different owner (SID mismatch)</td><td>Files belong to old PC's user — new PC can't write</td></tr>
  <tr><td>No permissions (ACL)</td><td>New PC user not in access list</td></tr>
  <tr><td>Read-only attribute</td><td>Files locked from editing</td></tr>
  <tr><td>Zone Identifier (MOTW)</td><td>Windows blocks files "from another computer"</td></tr>
</table>

<h3>4 FIX STEPS (applied automatically)</h3>
<p><span class="h-tag">1</span> <strong>Take ownership</strong> — transfer file ownership to you (takeown)</p>
<p><span class="h-tag">2</span> <strong>Grant full access</strong> — add permissions for Administrators + your user (icacls /c — continues even if some files error)</p>
<p><span class="h-tag">3</span> <strong>Remove read-only</strong> — clear the read-only flag (attrib -R)</p>
<p><span class="h-tag">4</span> <strong>Unblock files</strong> — delete Zone.Identifier data stream to remove block</p>

<h3>FIX MODES</h3>
<table>
  <tr><th>MODE</th><th>HOW IT WORKS</th><th>PROS</th><th>CONS</th></tr>
  <tr><td class="h-gold">⚡ Quick Fix</td><td>Runs takeown /r, icacls /t /c, attrib /S /D on entire drive at once. Then batch-unblocks all files.</td><td>Fastest — Windows handles recursion natively</td><td>No per-file report, can't see what was wrong</td></tr>
  <tr><td class="h-blue">▸ Scan & Fix</td><td>Walks all files to detect issues (read-only, blocked, access denied) using native checks — no PowerShell per file. Then fixes only problem files individually.</td><td>Shows exactly what was wrong and what got fixed, grouped by cause and file type</td><td>Slower because it scans every file first</td></tr>
  <tr><td class="h-green">📁 Fix Specific Folder</td><td>Same scan & fix logic but on a single folder. Detects issues natively, fixes only problems.</td><td>Same detail as Scan & Fix, much faster scope</td><td>Only fixes the chosen folder</td></tr>
</table>

<h3>PERFORMANCE</h3>
<p><strong>What determines speed:</strong></p>
<table>
  <tr><th>FACTOR</th><th>IMPACT</th><th>WHY</th></tr>
  <tr><td><strong>Number of files</strong></td><td>1K ≈ seconds, 100K ≈ minutes, 1M+ ≈ 10+ min</td><td>Each file needs disk read/write for permissions</td></tr>
  <tr><td><strong>Disk type</strong></td><td>SSD is 3-5x faster than HDD</td><td>Permission changes are random I/O — SSD excels at this</td></tr>
  <tr><td><strong>Disk activity</strong></td><td>Other programs slow it down</td><td>Shared disk bandwidth between all programs</td></tr>
  <tr><td><strong>Antivirus</strong></td><td>Can slow 2-3x</td><td>AV scans every file permission change</td></tr>
</table>
<p class="h-muted">The bottleneck is always disk I/O — the program itself uses near-zero CPU. Issue detection uses native Rust file checks (microseconds each), not PowerShell (which would add 300ms per file).</p>

<table>
  <tr><th>MODE</th><th>100K FILES (SSD)</th><th>100K FILES (HDD)</th><th>REPORT</th></tr>
  <tr><td>⚡ Quick Fix</td><td>~1-3 min</td><td>~5-10 min</td><td>None</td></tr>
  <tr><td>📁 Specific Folder (1K files)</td><td>~5-15 sec</td><td>~15-30 sec</td><td>Full</td></tr>
  <tr><td>▸ Scan & Fix (full drive)</td><td>~3-8 min</td><td>~10-20 min</td><td>Full</td></tr>
</table>

<h3>AFTER FIXING</h3>
<p class="h-muted">If Excel still shows "Protected View", it's a separate Excel setting:<br>
File → Options → Trust Center → Protected View → uncheck all 3 options.</p>
`,
  },
  th: {
    selectTarget:   '\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22',
    folderBtn:      '\u0E41\u0E01\u0E49\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01',
    folderDesc:     '\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02',
    quickDesc:      '\u0E41\u0E01\u0E49\u0E17\u0E38\u0E01\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E23\u0E27\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27 \u0E40\u0E23\u0E47\u0E27\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14',
    startDesc:      '\u0E2A\u0E41\u0E01\u0E19\u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E41\u0E01\u0E49\u0E17\u0E35\u0E25\u0E30\u0E44\u0E1F\u0E25\u0E4C \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19',
    step1:          '\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E44\u0E1F\u0E25\u0E4C',
    step2:          '\u0E43\u0E2B\u0E49\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E40\u0E02\u0E49\u0E32\u0E16\u0E36\u0E07\u0E41\u0E1A\u0E1A\u0E40\u0E15\u0E47\u0E21',
    step3:          '\u0E1B\u0E25\u0E14\u0E25\u0E47\u0E2D\u0E01\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27',
    step4:          '\u0E1B\u0E25\u0E14\u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E44\u0E1F\u0E25\u0E4C\u0E08\u0E32\u0E01\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2D\u0E37\u0E48\u0E19',
    results:        '\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C',
    export:         '\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01 Log',
    statScanned:    '\u0E2A\u0E41\u0E01\u0E19\u0E41\u0E25\u0E49\u0E27',
    statIssues:     '\u0E1B\u0E31\u0E0D\u0E2B\u0E32',
    statFixed:      '\u0E41\u0E01\u0E49\u0E41\u0E25\u0E49\u0E27',
    statFailed:     '\u0E41\u0E01\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49',
    ready:          '\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19',
    noTarget:       '\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E14\u0E23\u0E1F\u0E4C\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C',
    btnQuick:       '\u26A1\u2002\u0E41\u0E01\u0E49\u0E44\u0E02\u0E14\u0E48\u0E27\u0E19',
    btnStart:       '\u25B8\u2002\u0E2A\u0E41\u0E01\u0E19\u0E41\u0E25\u0E49\u0E27\u0E41\u0E01\u0E49',
    btnRunning:     '\u25B8\u2002\u0E01\u0E33\u0E25\u0E31\u0E07\u0E17\u0E33\u0E07\u0E32\u0E19...',
    scanning_pt:    '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E41\u0E01\u0E19 \u2014 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E2D...',
    done_pt:        '\u0E40\u0E2A\u0E23\u0E47\u0E08!',
    log_welcome1:   '\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E14\u0E23\u0E1F\u0E4C\u0E2B\u0E23\u0E37\u0E2D\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C \u0E41\u0E25\u0E49\u0E27\u0E01\u0E14 Start',
    log_welcome2:   '\u0E43\u0E0A\u0E49 Quick Fix \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E1A\u0E1A\u0E40\u0E23\u0E47\u0E27\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14',
    log_target:     '\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22',
    log_drives:     '\u0E44\u0E14\u0E23\u0E1F\u0E4C',
    log_done:       '\u0E40\u0E2A\u0E23\u0E47\u0E08!',
    log_started:    '\u0E40\u0E23\u0E34\u0E48\u0E21',
    log_finished:   '\u0E40\u0E2A\u0E23\u0E47\u0E08',
    helpTitle:      '\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21\u0E19\u0E35\u0E49',
    help: `
<h3>\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21\u0E19\u0E35\u0E49\u0E17\u0E33\u0E2D\u0E30\u0E44\u0E23?</h3>
<p>\u0E41\u0E01\u0E49\u0E1B\u0E31\u0E0D\u0E2B\u0E32\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E22\u0E49\u0E32\u0E22\u0E2E\u0E32\u0E23\u0E4C\u0E14\u0E14\u0E34\u0E2A\u0E01\u0E4C\u0E08\u0E32\u0E01\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E44\u0E1B\u0E2D\u0E35\u0E01\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07</p>
<p class="h-muted">\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E1E\u0E1A: \u0E40\u0E1B\u0E34\u0E14/\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E1F\u0E25\u0E4C\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49, Excel \u0E40\u0E1B\u0E34\u0E14\u0E41\u0E1A\u0E1A\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27, \u0E02\u0E36\u0E49\u0E19 "Access Denied"</p>

<h3>\u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38\u0E02\u0E2D\u0E07\u0E1B\u0E31\u0E0D\u0E2B\u0E32</h3>
<table>
  <tr><th>\u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38</th><th>\u0E40\u0E01\u0E34\u0E14\u0E2D\u0E30\u0E44\u0E23\u0E02\u0E36\u0E49\u0E19</th></tr>
  <tr><td>\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E15\u0E48\u0E32\u0E07\u0E01\u0E31\u0E19 (SID)</td><td>\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E2D\u0E07 user \u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E40\u0E01\u0E48\u0E32 \u2014 \u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E40\u0E02\u0E35\u0E22\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</td></tr>
  <tr><td>\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C (ACL)</td><td>user \u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E21\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C</td></tr>
  <tr><td>\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27</td><td>\u0E44\u0E1F\u0E25\u0E4C\u0E16\u0E39\u0E01\u0E25\u0E47\u0E2D\u0E01\u0E44\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E41\u0E01\u0E49\u0E44\u0E02</td></tr>
  <tr><td>Zone Identifier (MOTW)</td><td>Windows \u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E44\u0E1F\u0E25\u0E4C "\u0E21\u0E32\u0E08\u0E32\u0E01\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2D\u0E37\u0E48\u0E19"</td></tr>
</table>

<h3>4 \u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02 (\u0E17\u0E33\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34)</h3>
<p><span class="h-tag">1</span> <strong>\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07</strong> \u2014 \u0E42\u0E2D\u0E19\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E44\u0E1F\u0E25\u0E4C\u0E21\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13 (takeown)</p>
<p><span class="h-tag">2</span> <strong>\u0E43\u0E2B\u0E49\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E40\u0E02\u0E49\u0E32\u0E16\u0E36\u0E07</strong> \u2014 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E43\u0E2B\u0E49 Administrators + user \u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19 (icacls /c \u2014 \u0E02\u0E49\u0E32\u0E21 error \u0E41\u0E25\u0E49\u0E27\u0E17\u0E33\u0E15\u0E48\u0E2D)</p>
<p><span class="h-tag">3</span> <strong>\u0E1B\u0E25\u0E14\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27</strong> \u2014 \u0E25\u0E1A flag read-only (attrib -R)</p>
<p><span class="h-tag">4</span> <strong>\u0E1B\u0E25\u0E14\u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E44\u0E1F\u0E25\u0E4C</strong> \u2014 \u0E25\u0E1A Zone.Identifier data stream</p>

<h3>\u0E42\u0E2B\u0E21\u0E14\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02</h3>
<table>
  <tr><th>\u0E42\u0E2B\u0E21\u0E14</th><th>\u0E17\u0E33\u0E07\u0E32\u0E19\u0E22\u0E31\u0E07\u0E44\u0E07</th><th>\u0E02\u0E49\u0E2D\u0E14\u0E35</th><th>\u0E02\u0E49\u0E2D\u0E40\u0E2A\u0E35\u0E22</th></tr>
  <tr><td class="h-gold">\u26A1 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E14\u0E48\u0E27\u0E19</td><td>\u0E23\u0E31\u0E19 takeown /r, icacls /t /c, attrib /S /D \u0E17\u0E31\u0E49\u0E07\u0E44\u0E14\u0E23\u0E1F\u0E4C\u0E23\u0E27\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27 \u0E41\u0E25\u0E49\u0E27 batch-unblock</td><td>\u0E40\u0E23\u0E47\u0E27\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14 \u2014 Windows \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23 recursion \u0E40\u0E2D\u0E07</td><td>\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 \u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E27\u0E48\u0E32\u0E2D\u0E30\u0E44\u0E23\u0E1C\u0E34\u0E14\u0E1B\u0E01\u0E15\u0E34</td></tr>
  <tr><td class="h-blue">\u25B8 \u0E2A\u0E41\u0E01\u0E19\u0E41\u0E25\u0E49\u0E27\u0E41\u0E01\u0E49</td><td>\u0E2A\u0E41\u0E01\u0E19\u0E17\u0E38\u0E01\u0E44\u0E1F\u0E25\u0E4C\u0E14\u0E49\u0E27\u0E22 native Rust (\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E49 PowerShell) \u0E2B\u0E32\u0E44\u0E1F\u0E25\u0E4C\u0E17\u0E35\u0E48\u0E21\u0E35\u0E1B\u0E31\u0E0D\u0E2B\u0E32 \u0E41\u0E25\u0E49\u0E27\u0E41\u0E01\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E44\u0E1F\u0E25\u0E4C\u0E17\u0E35\u0E48\u0E21\u0E35\u0E1B\u0E31\u0E0D\u0E2B\u0E32</td><td>\u0E40\u0E2B\u0E47\u0E19\u0E27\u0E48\u0E32\u0E2D\u0E30\u0E44\u0E23\u0E1C\u0E34\u0E14\u0E1B\u0E01\u0E15\u0E34 \u0E08\u0E31\u0E14\u0E01\u0E25\u0E38\u0E48\u0E21\u0E15\u0E32\u0E21\u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38+\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E44\u0E1F\u0E25\u0E4C</td><td>\u0E0A\u0E49\u0E32\u0E01\u0E27\u0E48\u0E32\u0E40\u0E1E\u0E23\u0E32\u0E30\u0E15\u0E49\u0E2D\u0E07\u0E2A\u0E41\u0E01\u0E19\u0E17\u0E38\u0E01\u0E44\u0E1F\u0E25\u0E4C\u0E01\u0E48\u0E2D\u0E19</td></tr>
  <tr><td class="h-green">\u{1F4C1} \u0E41\u0E01\u0E49\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01</td><td>\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E2A\u0E41\u0E01\u0E19\u0E41\u0E25\u0E49\u0E27\u0E41\u0E01\u0E49 \u0E41\u0E15\u0E48\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01</td><td>\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E04\u0E23\u0E1A \u0E40\u0E23\u0E47\u0E27\u0E01\u0E27\u0E48\u0E32\u0E2A\u0E41\u0E01\u0E19\u0E17\u0E31\u0E49\u0E07\u0E44\u0E14\u0E23\u0E1F\u0E4C</td><td>\u0E41\u0E01\u0E49\u0E41\u0E04\u0E48\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19</td></tr>
</table>

<h3>\u0E1B\u0E23\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E20\u0E32\u0E1E / \u0E04\u0E27\u0E32\u0E21\u0E40\u0E23\u0E47\u0E27</h3>
<p><strong>\u0E2D\u0E30\u0E44\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E41\u0E1B\u0E23:</strong></p>
<table>
  <tr><th>\u0E1B\u0E31\u0E08\u0E08\u0E31\u0E22</th><th>\u0E1C\u0E25\u0E01\u0E23\u0E30\u0E17\u0E1A</th><th>\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25</th></tr>
  <tr><td><strong>\u0E08\u0E33\u0E19\u0E27\u0E19\u0E44\u0E1F\u0E25\u0E4C</strong></td><td>1K \u2248 \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35, 100K \u2248 \u0E19\u0E32\u0E17\u0E35, 1M+ \u2248 10+ \u0E19\u0E32\u0E17\u0E35</td><td>\u0E41\u0E15\u0E48\u0E25\u0E30\u0E44\u0E1F\u0E25\u0E4C\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E48\u0E32\u0E19/\u0E40\u0E02\u0E35\u0E22\u0E19\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E08\u0E32\u0E01\u0E14\u0E34\u0E2A\u0E01\u0E4C</td></tr>
  <tr><td><strong>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E14\u0E34\u0E2A\u0E01\u0E4C</strong></td><td>SSD \u0E40\u0E23\u0E47\u0E27\u0E01\u0E27\u0E48\u0E32 HDD 3-5 \u0E40\u0E17\u0E48\u0E32</td><td>\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E40\u0E1B\u0E47\u0E19 random I/O \u2014 SSD \u0E16\u0E19\u0E31\u0E14</td></tr>
  <tr><td><strong>\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E14\u0E34\u0E2A\u0E01\u0E4C</strong></td><td>\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21\u0E2D\u0E37\u0E48\u0E19\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E0A\u0E49\u0E32\u0E25\u0E07</td><td>\u0E41\u0E1A\u0E48\u0E07 bandwidth \u0E14\u0E34\u0E2A\u0E01\u0E4C\u0E01\u0E31\u0E1A\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21\u0E2D\u0E37\u0E48\u0E19</td></tr>
  <tr><td><strong>\u0E41\u0E2D\u0E19\u0E15\u0E35\u0E49\u0E44\u0E27\u0E23\u0E31\u0E2A</strong></td><td>\u0E0A\u0E49\u0E32\u0E25\u0E07 2-3 \u0E40\u0E17\u0E48\u0E32</td><td>AV \u0E2A\u0E41\u0E01\u0E19\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C</td></tr>
</table>
<p class="h-muted">\u0E04\u0E2D\u0E02\u0E27\u0E14\u0E04\u0E37\u0E2D disk I/O \u0E40\u0E2A\u0E21\u0E2D \u2014 \u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21\u0E43\u0E0A\u0E49 CPU \u0E41\u0E17\u0E1A\u0E28\u0E39\u0E19\u0E22\u0E4C \u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2B\u0E32\u0E1B\u0E31\u0E0D\u0E2B\u0E32\u0E43\u0E0A\u0E49 native Rust (\u0E44\u0E21\u0E48\u0E01\u0E35\u0E48\u0E44\u0E21\u0E42\u0E04\u0E23\u0E27\u0E34\u0E19\u0E32\u0E17\u0E35/\u0E44\u0E1F\u0E25\u0E4C) \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E49 PowerShell (\u0E17\u0E35\u0E48\u0E08\u0E30\u0E40\u0E1E\u0E34\u0E48\u0E21 300ms/\u0E44\u0E1F\u0E25\u0E4C)</p>

<table>
  <tr><th>\u0E42\u0E2B\u0E21\u0E14</th><th>100K \u0E44\u0E1F\u0E25\u0E4C (SSD)</th><th>100K \u0E44\u0E1F\u0E25\u0E4C (HDD)</th><th>\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19</th></tr>
  <tr><td>\u26A1 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E14\u0E48\u0E27\u0E19</td><td>~1-3 \u0E19\u0E32\u0E17\u0E35</td><td>~5-10 \u0E19\u0E32\u0E17\u0E35</td><td>\u0E44\u0E21\u0E48\u0E21\u0E35</td></tr>
  <tr><td>\u{1F4C1} \u0E41\u0E01\u0E49\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C (1K \u0E44\u0E1F\u0E25\u0E4C)</td><td>~5-15 \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35</td><td>~15-30 \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35</td><td>\u0E04\u0E23\u0E1A</td></tr>
  <tr><td>\u25B8 \u0E2A\u0E41\u0E01\u0E19\u0E41\u0E25\u0E49\u0E27\u0E41\u0E01\u0E49 (\u0E17\u0E31\u0E49\u0E07\u0E44\u0E14\u0E23\u0E1F\u0E4C)</td><td>~3-8 \u0E19\u0E32\u0E17\u0E35</td><td>~10-20 \u0E19\u0E32\u0E17\u0E35</td><td>\u0E04\u0E23\u0E1A</td></tr>
</table>

<h3>\u0E2B\u0E25\u0E31\u0E07\u0E41\u0E01\u0E49\u0E41\u0E25\u0E49\u0E27</h3>
<p class="h-muted">\u0E16\u0E49\u0E32 Excel \u0E22\u0E31\u0E07\u0E41\u0E2A\u0E14\u0E07 "Protected View" \u0E40\u0E1B\u0E47\u0E19\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E41\u0E22\u0E01\u0E02\u0E2D\u0E07 Excel:<br>
File \u2192 Options \u2192 Trust Center \u2192 Protected View \u2192 \u0E40\u0E2D\u0E32\u0E15\u0E34\u0E4A\u0E01\u0E2D\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07 3 \u0E0A\u0E48\u0E2D\u0E07</p>
`,
  }
};

function L(key) {
  return i18n[lang][key] || i18n['en'][key] || key;
}

function applyLang() {
  const t = i18n[lang];
  const el = (id) => document.getElementById(id);

  if (el('drivesLabel'))  el('drivesLabel').textContent = t.selectTarget;
  if (el('t_folderBtn'))  el('t_folderBtn').textContent = t.folderBtn;
  if (el('t_folderDesc')) el('t_folderDesc').textContent = t.folderDesc;
  if (el('t_quickDesc'))  el('t_quickDesc').textContent = t.quickDesc;
  if (el('t_startDesc'))  el('t_startDesc').textContent = t.startDesc;
  if (el('t_step1'))      el('t_step1').textContent = t.step1;
  if (el('t_step2'))      el('t_step2').textContent = t.step2;
  if (el('t_step3'))      el('t_step3').textContent = t.step3;
  if (el('t_step4'))      el('t_step4').textContent = t.step4;
  if (el('t_results'))    el('t_results').textContent = t.results;
  if (el('t_export'))     el('t_export').textContent = t.export;
  if (el('t_statScanned')) el('t_statScanned').textContent = t.statScanned;
  if (el('t_statIssues'))  el('t_statIssues').textContent = t.statIssues;
  if (el('t_statFixed'))   el('t_statFixed').textContent = t.statFixed;
  if (el('t_statFailed'))  el('t_statFailed').textContent = t.statFailed;
  if (el('pText') && !isRunning) el('pText').textContent = t.ready;
  if (el('langBtn')) el('langBtn').textContent = lang === 'en' ? 'TH' : 'EN';
  if (el('btnQuick') && !isRunning) el('btnQuick').textContent = t.btnQuick;
  if (el('btnStart') && !isRunning) el('btnStart').textContent = t.btnStart;
}

function toggleLang() {
  lang = (lang === 'en') ? 'th' : 'en';
  applyLang();
}
