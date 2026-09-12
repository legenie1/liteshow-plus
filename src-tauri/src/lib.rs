mod commands;
mod error;
mod imaging;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::images::list_images,
            commands::images::get_full_image,
            commands::thumbnails::get_thumbnail,
            commands::monitors::list_monitors,
            commands::monitors::open_projection_window,
            commands::projection::get_projection_state,
            commands::projection::set_current_image,
            commands::projection::toggle_blackout,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
