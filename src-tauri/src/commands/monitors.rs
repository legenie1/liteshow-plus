use serde::Serialize;
use tauri::{AppHandle, Manager, Monitor, Position, Size, WebviewUrl, WebviewWindowBuilder};

use crate::error::AppError;

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

    let result: Vec<MonitorInfo> = monitors
        .iter()
        .enumerate()
        .map(|(index, monitor)| to_monitor_info(monitor, index, &primary_id))
        .collect();

    eprintln!("[liteshow] list_monitors -> {result:#?}");

    Ok(result)
}

/// Creates the borderless projection window on first call, or moves/resizes the
/// existing one, so re-selecting a monitor never leaves a stray window behind.
#[tauri::command]
pub fn open_projection_window(app: AppHandle, monitor_id: String) -> Result<(), AppError> {
    let monitors = app.available_monitors()?;
    let target = monitors
        .iter()
        .enumerate()
        .find(|(index, monitor)| self::monitor_id(monitor, *index) == monitor_id)
        .map(|(_, monitor)| monitor.clone())
        .ok_or_else(|| AppError::new(format!("monitor '{monitor_id}' not found")))?;

    // Physical, not logical: monitors can have different DPI scale factors, and
    // mixing that up with logical coordinates is a common source of a projection
    // window landing at the wrong place/size (or off-screen) on a mixed-DPI setup.
    let position = *target.position();
    let size = *target.size();

    eprintln!(
        "[liteshow] open_projection_window monitor_id={monitor_id:?} target.position={position:?} target.size={size:?} scale_factor={}",
        target.scale_factor()
    );

    // Window creation/manipulation is dispatched to the main thread and run
    // fire-and-forget: calling `.build()`/`set_position()` directly from this
    // command (which runs on a worker thread) was observed to hang indefinitely
    // on this machine's multi-monitor setup, so we don't block this command on
    // their completion — the frontend doesn't need the window handle back.
    let app_for_main = app.clone();
    app.run_on_main_thread(move || {
        if let Some(window) = app_for_main.get_webview_window(PROJECTION_WINDOW_LABEL) {
            eprintln!("[liteshow] (main thread) moving existing projection window");
            if let Err(err) = window.set_position(Position::Physical(position)) {
                eprintln!("[liteshow] set_position failed: {err}");
            }
            if let Err(err) = window.set_size(Size::Physical(size)) {
                eprintln!("[liteshow] set_size failed: {err}");
            }
            if let Err(err) = window.set_focus() {
                eprintln!("[liteshow] set_focus failed: {err}");
            }
            eprintln!("[liteshow] (main thread) move done");
            return;
        }

        eprintln!("[liteshow] (main thread) building new projection window");

        // "/" rather than "index.html": in `tauri dev` the SvelteKit dev server
        // only serves the SPA at its route paths, not the literal built filename
        // — using "index.html" here 404s in dev even though it matches the main
        // window's resolved production path.
        // TEMP DIAGNOSTIC: bare-minimum builder, no position/decorations, to
        // isolate whether ANY second window hangs or specifically this one.
        let result = WebviewWindowBuilder::new(
            &app_for_main,
            PROJECTION_WINDOW_LABEL,
            WebviewUrl::App("/".into()),
        )
        .title("LiteShow — Projection")
        .build();

        match result {
            Ok(window) => {
                eprintln!("[liteshow] (main thread) build() done");
                if let Err(err) = window.set_position(Position::Physical(position)) {
                    eprintln!("[liteshow] set_position failed: {err}");
                }
                if let Err(err) = window.set_size(Size::Physical(size)) {
                    eprintln!("[liteshow] set_size failed: {err}");
                }
                eprintln!("[liteshow] (main thread) create done");
            }
            Err(err) => eprintln!("[liteshow] build() failed: {err}"),
        }
    })?;

    eprintln!("[liteshow] run_on_main_thread enqueued");

    Ok(())
}
