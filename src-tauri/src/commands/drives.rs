use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DriveInfo {
    #[serde(alias = "Letter")]
    pub letter: String,
    #[serde(alias = "Label")]
    pub label: String,
    #[serde(alias = "TotalGB")]
    pub total_gb: f64,
    #[serde(alias = "FreeGB")]
    pub free_gb: f64,
}

#[tauri::command]
pub async fn get_drives() -> Result<Vec<DriveInfo>, String> {
    #[cfg(target_os = "windows")]
    {
        get_drives_windows()
    }
    #[cfg(not(target_os = "windows"))]
    {
        // Mock data for macOS development
        Ok(vec![
            DriveInfo {
                letter: "C:".into(),
                label: "Windows".into(),
                total_gb: 237.5,
                free_gb: 89.2,
            },
            DriveInfo {
                letter: "D:".into(),
                label: "Data Drive".into(),
                total_gb: 931.5,
                free_gb: 342.8,
            },
            DriveInfo {
                letter: "E:".into(),
                label: "Backup".into(),
                total_gb: 1862.9,
                free_gb: 1204.3,
            },
        ])
    }
}

#[cfg(target_os = "windows")]
fn get_drives_windows() -> Result<Vec<DriveInfo>, String> {
    use std::os::windows::process::CommandExt;
    use std::process::Command;

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            r#"Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Root -and (Test-Path $_.Root) } | ForEach-Object {
                $di = [System.IO.DriveInfo]::new($_.Root)
                if ($di.DriveType -eq 'Fixed' -or $di.DriveType -eq 'Removable') {
                    [PSCustomObject]@{
                        Letter = $_.Root.TrimEnd('\').ToUpper()
                        Label = if($di.VolumeLabel){$di.VolumeLabel}else{'Local Disk'}
                        TotalGB = [math]::Round($di.TotalSize/1GB, 1)
                        FreeGB = [math]::Round($di.AvailableFreeSpace/1GB, 1)
                    }
                }
            } | ConvertTo-Json -Compress"#,
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("Failed to run PowerShell: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("PowerShell error: {}", stderr));
    }

    let json = String::from_utf8_lossy(&output.stdout);
    let json = json.trim();

    if json.is_empty() {
        return Ok(vec![]);
    }

    // PowerShell returns a single object (not array) when there's only one drive
    if json.starts_with('[') {
        serde_json::from_str(json).map_err(|e| format!("Parse error: {}", e))
    } else {
        let single: DriveInfo =
            serde_json::from_str(json).map_err(|e| format!("Parse error: {}", e))?;
        Ok(vec![single])
    }
}
