use serde::Serialize;
use tauri::{AppHandle, Manager, Monitor, Position, Size, WebviewUrl, WebviewWindowBuilder};

use crate::error::AppError;

const MAIN_WINDOW_LABEL: &str = "main";
const PROJECTION_WINDOW_LABEL: &str = "projection";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitorInfo {
    pub id: String,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub is_primary: bool,
}

fn monitor_id(monitor: &Monitor, index: usize) -> String {
    monitor
        .name()
        .cloned()
        .unwrap_or_else(|| format!("monitor-{index}"))
}

fn to_monitor_info(monitor: &Monitor, index: usize, primary_id: &Option<String>) -> MonitorInfo {
    let id = monitor_id(monitor, index);
    let is_primary = primary_id.as_deref() == Some(id.as_str());
    MonitorInfo {
        name: id.clone(),
        id,
        width: monitor.size().width,
        height: monitor.size().height,
        x: monitor.position().x,
        y: monitor.position().y,
        is_primary,
    }
}

#[tauri::command]
pub fn list_monitors(app: AppHandle) -> Result<Vec<MonitorInfo>, AppError> {
    let monitors = app.available_monitors()?;
    let primary_id = app.primary_monitor()?.map(|m| monitor_id(&m, usize::MAX));

    Ok(monitors
        .iter()
        .enumerate()
        .map(|(index, monitor)| to_monitor_info(monitor, index, &primary_id))
        .collect())
}

/// Creates the borderless projection window on first call, or moves/resizes the
/// existing one, so re-selecting a monitor never leaves a stray window behind.
///
/// Must stay `async`: sync commands run on the main thread, where building a window
/// deadlocks on Windows (WebView2).
#[tauri::command]
pub async fn open_projection_window(app: AppHandle, monitor_id: String) -> Result<(), AppError> {
    let monitors = app.available_monitors()?;
    let target = monitors
        .iter()
        .enumerate()
        .find(|(index, monitor)| self::monitor_id(monitor, *index) == monitor_id)
        .map(|(_, monitor)| monitor.clone())
        .ok_or_else(|| AppError::new(format!("monitor '{monitor_id}' not found")))?;

    let window = match app.get_webview_window(PROJECTION_WINDOW_LABEL) {
        Some(window) => window,
        // "/" rather than "index.html": the SvelteKit dev server only serves the
        // SPA at its route paths, not the literal built filename.
        None => {
            WebviewWindowBuilder::new(&app, PROJECTION_WINDOW_LABEL, WebviewUrl::App("/".into()))
                .title("LiteShow - Projection")
                .decorations(false)
                .resizable(false)
                .shadow(false)
                .visible(false)
                .build()?
        }
    };

    // Physical, not logical: monitors can have different DPI scale factors. Size is
    // set after position because crossing to another DPI rescales the window.
    window.set_position(Position::Physical(*target.position()))?;
    window.set_size(Size::Physical(*target.size()))?;
    window.show()?;

    // Keyboard shortcuts live in the control window, so it must keep the focus.
    if let Some(main) = app.get_webview_window(MAIN_WINDOW_LABEL) {
        main.set_focus()?;
    }

    Ok(())
}
