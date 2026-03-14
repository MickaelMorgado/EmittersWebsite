#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use tauri::GlobalWindowEvent;

fn main() {
  let context = tauri::generate_context!();

  tauri::Builder::default()
    .menu(
      tauri::Menu::os_default(&context.package_info().name)
    )
    .invoke_handler(tauri::generate_handler![])
    .run(context)
    .expect("error while running tauri application");
}
