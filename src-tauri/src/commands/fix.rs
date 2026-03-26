#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
use std::time::Instant;
use tauri::{AppHandle, Emitter};

#[cfg(target_os = "windows")]
use std::collections::HashMap;
#[cfg(target_os = "windows")]
use std::process::Command;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub enum FixMode {
    #[serde(rename = "scan_fix")]
    ScanFix,
    #[serde(rename = "fix_folder")]
    FixFolder,
    #[serde(rename = "quick_fix")]
    QuickFix,
}

#[derive(Debug, Serialize, Clone, Default)]
pub struct FixStats {
    pub scanned: u64,
    pub issues: u64,
    pub fixed: u64,
    pub failed: u64,
    pub percent: u32,
}

#[derive(Debug, Serialize, Clone)]
pub struct ProgressEvent {
    pub phase: String,
    pub current: u64,
    pub total: u64,
    pub message: String,
    pub log_type: String,
    pub stats: FixStats,
}

#[derive(Debug, Serialize, Clone)]
pub struct CauseSummary {
    pub cause: String,
    pub count: u64,
}

#[derive(Debug, Serialize, Clone)]
pub struct ExtSummary {
    pub ext: String,
    pub count: u64,
}

#[derive(Debug, Serialize)]
pub struct FixResult {
    pub stats: FixStats,
    pub elapsed_secs: u64,
    pub cause_summary: Vec<CauseSummary>,
    pub fixed_by_ext: Vec<ExtSummary>,
    pub failed_by_ext: Vec<ExtSummary>,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn emit_progress(app: &AppHandle, event: ProgressEvent) {
    let _ = app.emit("fix-progress", event);
}

fn emit_log(app: &AppHandle, msg: &str, log_type: &str, stats: &FixStats) {
    emit_progress(
        app,
        ProgressEvent {
            phase: "log".into(),
            current: 0,
            total: 0,
            message: msg.to_string(),
            log_type: log_type.to_string(),
            stats: stats.clone(),
        },
    );
}

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[cfg(target_os = "windows")]
const ADMIN_SID: &str = "*S-1-5-32-544";

#[cfg(target_os = "windows")]
fn run_cmd(program: &str, args: &[&str]) -> Result<(), String> {
    use std::os::windows::process::CommandExt;
    let output = Command::new(program)
        .args(args)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("{} failed: {}", program, e))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let msg = stderr.trim();
        if !msg.is_empty() {
            return Err(format!("{}: {}", program, msg));
        }
        return Err(format!("{}: exited with code {:?}", program, output.status.code()));
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn get_current_user() -> String {
    if let Ok(user) = std::env::var("USERNAME") {
        if let Ok(domain) = std::env::var("USERDOMAIN") {
            return format!("{}\\{}", domain, user);
        }
        return user;
    }
    "UNKNOWN".to_string()
}

// ---------------------------------------------------------------------------
// Pure Rust cause detection (NO PowerShell — instant, no subprocess)
// ---------------------------------------------------------------------------

#[cfg(target_os = "windows")]
fn get_causes_native(path: &str, is_dir: bool) -> Vec<String> {
    let mut causes = Vec::new();

    // Check read-only attribute (files only, dirs are usually read-only by nature)
    if !is_dir {
        if let Ok(meta) = std::fs::metadata(path) {
            if meta.permissions().readonly() {
                causes.push("Marked as read-only".to_string());
            }
        }
    }

    // Check Zone.Identifier alternate data stream
    // On Windows, "path:Zone.Identifier" is the ADS path
    let zone_path = format!("{}:Zone.Identifier", path);
    if std::path::Path::new(&zone_path).exists() {
        causes.push("Blocked (came from another computer)".to_string());
    }

    // Note: Owner/ACL checks are not done here because:
    // - If walkdir can enumerate the file, basic read access exists
    // - Files with owner/ACL issues that BLOCK enumeration are caught as
    //   walkdir errors and added to the problem list automatically
    // - takeown + icacls will fix owner/ACL regardless
    // This avoids spawning PowerShell per-file (which was 300ms+ per call)

    causes
}

// ---------------------------------------------------------------------------
// Fix operations
// ---------------------------------------------------------------------------

#[cfg(target_os = "windows")]
fn fix_item_single(path: &str, is_dir: bool, user: &str) -> Result<(), String> {
    if is_dir {
        // For directories found during scan, DON'T use /r /t
        // because child items are tracked individually in the problem list.
        // Using /r /t here would re-fix children redundantly.
        run_cmd("takeown", &["/f", path, "/d", "y"])?;
        run_cmd("icacls", &[path, "/grant", &format!("{}:(OI)(CI)F", ADMIN_SID), "/c"])?;
        run_cmd("icacls", &[path, "/grant", &format!("{}:(OI)(CI)F", user), "/c"])?;
        run_cmd("attrib", &["-R", path])?;
        // Unblock the dir itself
        let zone = format!("{}:Zone.Identifier", path);
        let _ = std::fs::remove_file(&zone);
    } else {
        run_cmd("takeown", &["/f", path])?;
        run_cmd("icacls", &[path, "/grant", &format!("{}:F", ADMIN_SID), "/c"])?;
        run_cmd("icacls", &[path, "/grant", &format!("{}:F", user), "/c"])?;
        run_cmd("attrib", &["-R", path])?;
        let zone = format!("{}:Zone.Identifier", path);
        let _ = std::fs::remove_file(&zone);
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn get_ext(path: &str, is_dir: bool) -> String {
    if is_dir {
        return "[DIR]".into();
    }
    std::path::Path::new(path)
        .extension()
        .map(|e| format!(".{}", e.to_string_lossy().to_uppercase()))
        .unwrap_or_else(|| "[FILE]".into())
}

#[cfg(target_os = "windows")]
fn sorted_summary<T, F>(map: HashMap<String, u64>, make: F) -> Vec<T>
where
    F: Fn(String, u64) -> T,
    T: SortByCount,
{
    let mut v: Vec<T> = map.into_iter().map(|(k, c)| make(k, c)).collect();
    v.sort_by(|a, b| b.get_count().cmp(&a.get_count()));
    v
}

#[cfg(target_os = "windows")]
trait SortByCount {
    fn get_count(&self) -> u64;
}
#[cfg(target_os = "windows")]
impl SortByCount for CauseSummary {
    fn get_count(&self) -> u64 { self.count }
}
#[cfg(target_os = "windows")]
impl SortByCount for ExtSummary {
    fn get_count(&self) -> u64 { self.count }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn run_fix(
    app: AppHandle,
    mode: FixMode,
    drives: Vec<String>,
    folder: Option<String>,
) -> Result<FixResult, String> {
    // Validate drive letters: must be exactly 1 letter + colon (e.g. "C:")
    for d in &drives {
        let bytes = d.as_bytes();
        if bytes.len() != 2 || !bytes[0].is_ascii_alphabetic() || bytes[1] != b':' {
            return Err(format!("Invalid drive letter: {}", d));
        }
    }

    // Validate folder path if provided
    if let Some(ref f) = folder {
        if f.contains("..") {
            return Err("Folder path must not contain '..'".to_string());
        }
        let p = std::path::Path::new(f);
        if !p.exists() || !p.is_dir() {
            return Err(format!("Folder does not exist or is not a directory: {}", f));
        }
    }

    let start = Instant::now();

    let mut result = match mode {
        FixMode::QuickFix => quick_fix_impl(&app, &drives, folder.as_deref()).await,
        FixMode::ScanFix => scan_fix_impl(&app, &drives).await,
        FixMode::FixFolder => {
            let f = folder.ok_or("No folder selected")?;
            scan_fix_single(&app, &f).await
        }
    }?;

    result.elapsed_secs = start.elapsed().as_secs();
    Ok(result)
}

// ===========================================================================
// macOS mock implementations
// ===========================================================================

#[cfg(not(target_os = "windows"))]
async fn quick_fix_impl(
    app: &AppHandle,
    drives: &[String],
    folder: Option<&str>,
) -> Result<FixResult, String> {
    let targets: Vec<String> = if let Some(f) = folder {
        vec![f.to_string()]
    } else {
        drives.to_vec()
    };
    let mut stats = FixStats::default();

    for target in &targets {
        for (i, step) in ["Taking ownership", "Granting permissions", "Removing read-only", "Unblocking files"].iter().enumerate() {
            stats.percent = ((i + 1) * 25) as u32;
            emit_progress(app, ProgressEvent {
                phase: "fixing".into(),
                current: i as u64 + 1, total: 4,
                message: format!("Step {}/4  {} of {} ...", i+1, step, target),
                log_type: "muted".into(),
                stats: stats.clone(),
            });
            std::thread::sleep(std::time::Duration::from_millis(300));
        }
        stats.fixed += 1;
    }

    stats.percent = 100;
    emit_log(app, "Quick Fix complete (mock)", "ok", &stats);

    Ok(FixResult {
        stats, elapsed_secs: 0,
        cause_summary: vec![], fixed_by_ext: vec![], failed_by_ext: vec![],
    })
}

#[cfg(not(target_os = "windows"))]
async fn scan_fix_impl(app: &AppHandle, drives: &[String]) -> Result<FixResult, String> {
    let mut stats = FixStats::default();
    emit_log(app, &format!("Scanning: {} (mock)", drives.join(", ")), "muted", &stats);
    std::thread::sleep(std::time::Duration::from_millis(500));

    stats.scanned = 31456; stats.issues = 147; stats.percent = 40;
    emit_progress(app, ProgressEvent {
        phase: "scanning".into(), current: 1, total: 1,
        message: "Scan complete (mock)".into(), log_type: "muted".into(), stats: stats.clone(),
    });

    std::thread::sleep(std::time::Duration::from_millis(500));

    stats.fixed = 145; stats.failed = 2; stats.percent = 100;
    emit_log(app, "Done! (mock)", "ok", &stats);

    Ok(FixResult {
        stats, elapsed_secs: 0,
        cause_summary: vec![
            CauseSummary { cause: "Blocked (came from another computer)".into(), count: 89 },
            CauseSummary { cause: "Owned by another user (John)".into(), count: 42 },
            CauseSummary { cause: "No permission for this PC".into(), count: 16 },
        ],
        fixed_by_ext: vec![
            ExtSummary { ext: ".XLSX".into(), count: 52 },
            ExtSummary { ext: ".DOCX".into(), count: 38 },
            ExtSummary { ext: ".PDF".into(), count: 29 },
        ],
        failed_by_ext: vec![ExtSummary { ext: ".DLL".into(), count: 2 }],
    })
}

#[cfg(not(target_os = "windows"))]
async fn scan_fix_single(app: &AppHandle, folder: &str) -> Result<FixResult, String> {
    let mut stats = FixStats::default();
    emit_log(app, &format!("Scanning folder: {} (mock)", folder), "muted", &stats);
    std::thread::sleep(std::time::Duration::from_millis(400));

    stats.scanned = 842; stats.issues = 23; stats.fixed = 22; stats.failed = 1; stats.percent = 100;
    emit_log(app, "Folder fix complete (mock)", "ok", &stats);

    Ok(FixResult {
        stats, elapsed_secs: 0,
        cause_summary: vec![
            CauseSummary { cause: "Blocked (came from another computer)".into(), count: 15 },
            CauseSummary { cause: "Marked as read-only".into(), count: 8 },
        ],
        fixed_by_ext: vec![
            ExtSummary { ext: ".XLSX".into(), count: 12 },
            ExtSummary { ext: ".PDF".into(), count: 10 },
        ],
        failed_by_ext: vec![ExtSummary { ext: ".DLL".into(), count: 1 }],
    })
}

// ===========================================================================
// Windows real implementations
// ===========================================================================

// ── Quick Fix: fastest, runs bulk commands with /r /t ──
#[cfg(target_os = "windows")]
async fn quick_fix_impl(
    app: &AppHandle,
    drives: &[String],
    folder: Option<&str>,
) -> Result<FixResult, String> {
    let targets: Vec<String> = if let Some(f) = folder {
        vec![f.to_string()]
    } else {
        drives.iter().map(|d| format!("{}\\", d)).collect()
    };

    let mut stats = FixStats::default();
    let user = get_current_user();
    let total_targets = targets.len();

    for (ti, target) in targets.iter().enumerate() {
        let base_pct = (ti * 100 / total_targets) as u32;
        let step_pct = (100 / total_targets / 4) as u32;

        // Step 1: takeown /r (recursive)
        stats.percent = base_pct;
        emit_log(app, &format!("Step 1/4  Taking ownership of {} ...", target), "muted", &stats);
        if let Err(_) = run_cmd("takeown", &["/f", target, "/r", "/d", "y"]) {
            stats.failed += 1;
        }

        // Step 2: icacls /t (recursive) with /c (continue on error)
        stats.percent = base_pct + step_pct;
        emit_log(app, "Step 2/4  Granting permissions...", "muted", &stats);
        if let Err(_) = run_cmd("icacls", &[target, "/grant", &format!("{}:(OI)(CI)F", ADMIN_SID), "/t", "/c"]) {
            stats.failed += 1;
        }
        if let Err(_) = run_cmd("icacls", &[target, "/grant", &format!("{}:(OI)(CI)F", user), "/t", "/c"]) {
            stats.failed += 1;
        }

        // Step 3: attrib -R /S /D (recursive)
        stats.percent = base_pct + step_pct * 2;
        emit_log(app, "Step 3/4  Removing read-only flags...", "muted", &stats);
        if let Err(_) = run_cmd("attrib", &["-R", &format!("{}*.*", target), "/S", "/D"]) {
            stats.failed += 1;
        }

        // Step 4: Unblock — walk with Rust and delete Zone.Identifier streams
        stats.percent = base_pct + step_pct * 3;
        emit_log(app, "Step 4/4  Unblocking files...", "muted", &stats);
        {
            let walker = walkdir::WalkDir::new(target)
                .follow_links(false)
                .into_iter();
            for entry in walker.flatten() {
                let zone = format!("{}:Zone.Identifier", entry.path().to_string_lossy());
                let _ = std::fs::remove_file(&zone);
            }
        }

        stats.fixed += 1;
        emit_log(app, &format!("{}  Done", target), "ok", &stats);
    }

    stats.percent = 100;
    emit_log(app, "Quick Fix complete", "ok", &stats);

    Ok(FixResult {
        stats, elapsed_secs: 0,
        cause_summary: vec![], fixed_by_ext: vec![], failed_by_ext: vec![],
    })
}

// ── Scan & Fix: walk → detect issues (pure Rust) → fix only problems ──
#[cfg(target_os = "windows")]
async fn scan_fix_impl(app: &AppHandle, drives: &[String]) -> Result<FixResult, String> {
    let mut stats = FixStats::default();
    let mut cause_counts: HashMap<String, u64> = HashMap::new();
    let mut fixed_by_ext: HashMap<String, u64> = HashMap::new();
    let mut failed_by_ext: HashMap<String, u64> = HashMap::new();
    let user = get_current_user();

    let mut all_problems: Vec<(String, bool, Vec<String>)> = Vec::new();

    // Phase 1: Scan all drives
    emit_log(app, &format!("Drives: {}", drives.join(", ")), "muted", &stats);

    for drv in drives {
        let root = format!("{}\\", drv);
        emit_log(app, &format!("Scanning {} ...", drv), "muted", &stats);

        let mut drive_items: u64 = 0;
        let mut drive_issues: u64 = 0;

        let walker = walkdir::WalkDir::new(&root)
            .follow_links(false)
            .into_iter();

        for entry in walker {
            match entry {
                Ok(e) => {
                    drive_items += 1;
                    stats.scanned += 1;

                    // Emit progress every 2000 items (not too frequent)
                    if drive_items % 2000 == 0 {
                        stats.percent = 0; // indeterminate during scan
                        emit_progress(app, ProgressEvent {
                            phase: "scanning".into(),
                            current: stats.scanned, total: 0,
                            message: format!("Scanning {} \u{2014} {} items...", drv, stats.scanned),
                            log_type: "muted".into(),
                            stats: stats.clone(),
                        });
                    }

                    // Pure Rust cause detection — no subprocess
                    let path = e.path().to_string_lossy().to_string();
                    let is_dir = e.file_type().is_dir();
                    let causes = get_causes_native(&path, is_dir);
                    if !causes.is_empty() {
                        for c in &causes {
                            *cause_counts.entry(c.clone()).or_insert(0) += 1;
                        }
                        all_problems.push((path, is_dir, causes));
                        drive_issues += 1;
                        stats.issues += 1;
                    }
                }
                Err(e) => {
                    // walkdir error = access denied or broken symlink
                    if let Some(path) = e.path() {
                        let path_str = path.to_string_lossy().to_string();
                        let is_dir = path.is_dir();
                        let cause = if e.io_error().map(|io| io.kind()) == Some(std::io::ErrorKind::PermissionDenied) {
                            "No permission for this PC"
                        } else {
                            "Cannot read permissions"
                        };
                        *cause_counts.entry(cause.to_string()).or_insert(0) += 1;
                        all_problems.push((path_str, is_dir, vec![cause.to_string()]));
                        drive_issues += 1;
                        stats.issues += 1;
                    }
                }
            }
        }

        emit_log(app, &format!("{}  \u{2192}  {} items,  {} issues", drv, drive_items, drive_issues), "muted", &stats);
    }

    // Phase 2: Fix only problem files
    if all_problems.is_empty() {
        stats.percent = 100;
        emit_log(app, "All good \u{2014} no issues found.", "ok", &stats);
    } else {
        let total = all_problems.len() as u64;
        emit_log(app, &format!("Fixing {} items...", total), "muted", &stats);

        for (i, (path, is_dir, _causes)) in all_problems.iter().enumerate() {
            let pct = ((i as u64 + 1) * 100 / total) as u32;
            // Emit progress every 50 items or at start/end
            if i % 50 == 0 || i + 1 == total as usize {
                stats.percent = pct;
                emit_progress(app, ProgressEvent {
                    phase: "fixing".into(),
                    current: i as u64 + 1, total,
                    message: format!("Fixing {} / {} ...", i + 1, total),
                    log_type: "muted".into(),
                    stats: stats.clone(),
                });
            }

            let ext = get_ext(path, *is_dir);
            match fix_item_single(path, *is_dir, &user) {
                Ok(()) => {
                    stats.fixed += 1;
                    *fixed_by_ext.entry(ext).or_insert(0) += 1;
                }
                Err(_) => {
                    stats.failed += 1;
                    *failed_by_ext.entry(ext).or_insert(0) += 1;
                }
            }
        }
    }

    stats.percent = 100;
    emit_progress(app, ProgressEvent {
        phase: "done".into(),
        current: stats.issues, total: stats.issues,
        message: if stats.issues == 0 {
            "All good \u{2014} no issues found.".into()
        } else {
            format!("Done! Fixed {}, Failed {}", stats.fixed, stats.failed)
        },
        log_type: "ok".into(),
        stats: stats.clone(),
    });

    Ok(FixResult {
        stats, elapsed_secs: 0,
        cause_summary: sorted_summary(cause_counts, |k, c| CauseSummary { cause: k, count: c }),
        fixed_by_ext: sorted_summary(fixed_by_ext, |k, c| ExtSummary { ext: k, count: c }),
        failed_by_ext: sorted_summary(failed_by_ext, |k, c| ExtSummary { ext: k, count: c }),
    })
}

// ── Fix Specific Folder: same scan+fix logic on a single path ──
#[cfg(target_os = "windows")]
async fn scan_fix_single(app: &AppHandle, folder: &str) -> Result<FixResult, String> {
    // Reuse scan_fix_impl with a single "drive" being the folder path
    // But strip trailing backslash so walkdir works correctly
    let clean = folder.trim_end_matches('\\').to_string();
    scan_fix_impl(app, &[clean]).await
}
