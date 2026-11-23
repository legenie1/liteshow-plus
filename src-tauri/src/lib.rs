mod commands;
mod error;
mod imaging;
mod state;

use state::AppState;
use tauri::{Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // The projection window never receives a click, so without this the webview
    // refuses to start a video with sound on its own.
    #[cfg(windows)]
    std::env::set_var(
        "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
        "--autoplay-policy=no-user-gesture-required",
    );

    commands::videos::register_protocol(tauri::Builder::default())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        // The borderless projection window has no close button of its own.
        .on_window_event(|window, event| {
            if window.label() == "main" && matches!(event, WindowEvent::CloseRequested { .. }) {
                window.app_handle().exit(0);
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::images::list_images,
            commands::images::get_full_image,
            commands::thumbnails::get_thumbnail,
            commands::monitors::list_monitors,
            commands::monitors::open_projection_window,
            commands::projection::get_projection_state,
            commands::projection::set_current_image,
            commands::projection::set_current_prayer,
            commands::projection::set_current_video,
            commands::projection::toggle_blackout,
            commands::projection::toggle_video_loop,
            commands::projection::toggle_video_mute,
            commands::videos::list_videos,
            commands::videos::toggle_video_playback,
            commands::videos::seek_video,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
