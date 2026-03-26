mod commands;

use commands::drives::get_drives;
use commands::fix::run_fix;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![get_drives, run_fix])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
