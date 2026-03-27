# TakeDriveOwnership

Take ownership & fix drive permissions for Windows.

![License](https://img.shields.io/badge/license-GPL--3.0-green)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078d4)
![Built with](https://img.shields.io/badge/built%20with-Tauri%20v2%20%2B%20Rust-24c8db)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-yellow?logo=buymeacoffee&logoColor=white)](https://buymeacoffee.com/zuaq)

**English** | [ภาษาไทย](README.th.md)

A lightweight Windows utility that fixes NTFS file permission issues when moving hard drives (HDD/SSD) between PCs. Resolves "Access Denied" errors, read-only Excel files, and blocked files caused by SID mismatch, missing ACL entries, and Zone Identifier (Mark of the Web). Built with Tauri v2 (Rust + HTML/CSS/JS).

> **Common searches this solves:** take ownership of files, fix drive permissions, access denied after moving hard drive, Excel protected view after drive swap, NTFS permission fix tool, reset file ownership Windows, icacls recursive fix, remove mark of the web, unblock files from another computer

---

## Why this exists

When you physically move a hard drive (HDD/SSD) from one Windows PC to another, you'll often run into these problems:

- **"Access Denied"** when opening or saving files
- **Excel opens in read-only / Protected View** and won't let you edit
- **Files are "blocked"** — Windows marks them as coming from another computer
- **Can't delete or rename** files you used to own

This happens because Windows NTFS stores file ownership and permissions tied to specific user accounts (SIDs). When the drive moves to a new PC, the new user account doesn't match the old one — so Windows denies access.

## What causes the problem

| Cause | Technical detail | Symptom |
|-------|-----------------|---------|
| **SID mismatch** | Files owned by old PC's user SID | New PC can't write — "Access Denied" |
| **Missing ACL entry** | New user not in file's access control list | No read/write permission |
| **Read-only attribute** | File flagged as read-only | Can open but can't save changes |
| **Zone Identifier (MOTW)** | Alternate data stream marks file as "from another computer" | Windows/Excel blocks the file |

## What this tool does

Applies 4 fix steps automatically to every affected file:

| Step | Command | What it does |
|------|---------|-------------|
| 1. **Take ownership** | `takeown` | Transfers file ownership from old user to you |
| 2. **Grant full access** | `icacls /c` | Adds full-control permission for Administrators + your user account. Uses `/c` flag to continue past errors |
| 3. **Remove read-only** | `attrib -R` | Clears the read-only attribute |
| 4. **Unblock files** | Delete `:Zone.Identifier` | Removes the alternate data stream that marks files as blocked |

## Fix modes

| Mode | How it works | Pros | Cons |
|------|-------------|------|------|
| **Quick Fix** | Runs `takeown /r`, `icacls /t /c`, `attrib /S /D` recursively on entire drives. Then batch-unblocks via PowerShell. | Fastest — Windows handles recursion natively | No per-file report |
| **Scan & Fix** | Walks every file with native Rust checks to detect issues (read-only, blocked, access denied), then fixes only problem files individually | Full report — grouped by cause and file type | Slower because it scans everything first |
| **Fix Specific Folder** | Same scan & fix logic but scoped to a single folder | Full report + much faster than full drive | Only fixes the selected folder |

### Performance

The bottleneck is always **disk I/O** (reading/writing file permissions), not the program itself. The app uses near-zero CPU.

| Factor | Impact | Why |
|--------|--------|-----|
| **Number of files** | 1K = seconds, 100K = minutes, 1M+ = 10+ min | Each file needs permission read/write on disk |
| **Disk type** | SSD is 3-5x faster than HDD | Permission changes are random I/O |
| **Antivirus** | Can slow 2-3x | AV scans every permission change |
| **Other disk activity** | Concurrent access slows it down | Shared disk bandwidth |

Estimated times for 100,000 files:

| Mode | SSD | HDD | Report |
|------|-----|-----|--------|
| Quick Fix | ~1-3 min | ~5-10 min | None |
| Fix Specific Folder (1K files) | ~5-15 sec | ~15-30 sec | Full |
| Scan & Fix (full drive) | ~3-8 min | ~10-20 min | Full |

Issue detection uses native Rust file system checks (microseconds per file) instead of spawning PowerShell per file, which would add ~300ms overhead each.

## Features

- **3 fix modes** — Quick Fix, Scan & Fix, Fix Specific Folder
- **Dark / Light theme** — toggle in title bar
- **English / Thai** — toggle in title bar
- **Real-time progress** — live stats (scanned / issues / fixed / failed) with progress bar
- **Summary report** — issues grouped by cause and fixed files grouped by extension
- **Export log** — save results to text file
- **Auto-elevate** — runs as Administrator automatically (UAC prompt)
- **Help overlay** — built-in documentation with mode comparison and performance info
- **Single .exe** — no installation, no dependencies, no runtime needed

## Download

Go to [**Releases**](../../releases) and download the latest `.exe`.

Requires **Windows 10 (version 1803+)** or **Windows 11**. NTFS formatted drives only.

## Compatibility

| Windows Version | Status | Note |
|----------------|--------|------|
| Windows 11 | Supported | Works out of the box |
| Windows 10 (1803+) | Supported | May auto-install WebView2 on first run |
| Windows 10 (pre-1803) | Not supported | Requires Tauri v2 minimum |
| Windows 8.1 / 8 / 7 | Not supported | — |

## After fixing

If Excel still shows **Protected View** after running this tool, that's a separate Excel-level setting:

> File → Options → Trust Center → Trust Center Settings → Protected View → uncheck all 3 options

This tool fixes Windows file permissions. Excel Trust Center is an independent security layer.

---

## Development

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) stable

### Run locally

```bash
npm install
npm run tauri dev
```

On macOS/Linux, the app runs with mock data (simulated drives) for UI development. All Windows-specific code compiles behind `#[cfg(target_os = "windows")]` with mock fallbacks.

### Build for Windows

```bash
npm run tauri build
```

Output: `src-tauri/target/release/TakeDriveOwnership.exe`

Automated builds run via GitHub Actions on tag push (see `.github/workflows/build.yml`).

### Architecture

```
src/                        Frontend (HTML/CSS/JS, no framework)
  index.html                UI layout, custom frameless title bar
  style.css                 Dark/Light theme via CSS variables
  app.js                    Tauri IPC, drive rendering, fix logic
  i18n.js                   EN/TH translations + help content
  theme.js                  Theme toggle

src-tauri/                  Backend (Rust)
  src/
    main.rs                 Entry point
    lib.rs                  Tauri plugin + command registration
    commands/
      drives.rs             Drive detection (PowerShell on Windows, mock on macOS)
      fix.rs                Fix operations — 3 modes with progress streaming
```

**Key design decisions:**
- Native Rust file checks instead of PowerShell for issue detection (~30,000x faster)
- `icacls /c` flag to continue past individual file errors
- Directories in scan mode don't use `/r /t` to avoid redundant re-fixing of child items
- Progress events streamed via `app.emit()` for real-time UI updates without polling
- `CREATE_NO_WINDOW` flag on all subprocess calls to prevent console flashing

## Contributing

Issues and pull requests welcome. Please test on actual Windows hardware with real moved drives when possible — mock mode on macOS can only validate UI behavior.

## License

[GPL-3.0](LICENSE)

This software is free and open source. You may use, modify, and redistribute it under the terms of the GNU General Public License v3.0. Any derivative work must also be open source under the same license.

---

If this tool saved you time, consider [buying me a coffee](https://buymeacoffee.com/zuaq).
