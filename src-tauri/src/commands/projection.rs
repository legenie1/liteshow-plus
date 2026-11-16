use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::error::AppError;
use crate::state::{AppState, PrayerPoint};

const PROJECTION_CHANGED_EVENT: &str = "projection-changed";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectionState {
    pub image: Option<String>,
    pub video: Option<String>,
    pub video_serial: u64,
    pub video_loop: bool,
    pub video_muted: bool,
    pub prayer: Option<PrayerPoint>,
    pub blackout: bool,
}

fn snapshot(state: &State<AppState>) -> Result<ProjectionState, AppError> {
    let image = state
        .current_image
        .lock()
        .map_err(|_| AppError::new("current_image lock poisoned"))?
        .clone();
    let video = state
        .current_video
        .lock()
        .map_err(|_| AppError::new("current_video lock poisoned"))?
        .clone();
    let prayer = state
        .current_prayer
        .lock()
        .map_err(|_| AppError::new("current_prayer lock poisoned"))?
        .clone();
    let video_serial = *state
        .video_serial
        .lock()
        .map_err(|_| AppError::new("video_serial lock poisoned"))?;
    let video_loop = *state
        .video_loop
        .lock()
        .map_err(|_| AppError::new("video_loop lock poisoned"))?;
    let video_muted = *state
        .video_muted
        .lock()
        .map_err(|_| AppError::new("video_muted lock poisoned"))?;
    let blackout = *state
        .is_blackout
        .lock()
        .map_err(|_| AppError::new("is_blackout lock poisoned"))?;
    Ok(ProjectionState {
        image,
        video,
        video_serial,
        video_loop,
        video_muted,
        prayer,
        blackout,
    })
}

#[tauri::command]
pub fn get_projection_state(state: State<AppState>) -> Result<ProjectionState, AppError> {
    snapshot(&state)
}

/// Selecting a new image (or clearing it) also cancels blackout, matching the
/// operator expectation that clicking a thumbnail always shows something. It
/// replaces any projected video or prayer point: the projection shows one thing
/// at a time.
#[tauri::command]
pub fn set_current_image(
    app: AppHandle,
    state: State<AppState>,
    path: Option<String>,
) -> Result<(), AppError> {
    *state
        .current_image
        .lock()
        .map_err(|_| AppError::new("current_image lock poisoned"))? = path;
    *state
        .current_prayer
        .lock()
        .map_err(|_| AppError::new("current_prayer lock poisoned"))? = None;
    *state
        .current_video
        .lock()
        .map_err(|_| AppError::new("current_video lock poisoned"))? = None;
    *state
        .is_blackout
        .lock()
        .map_err(|_| AppError::new("is_blackout lock poisoned"))? = false;

    app.emit(PROJECTION_CHANGED_EVENT, snapshot(&state)?)?;
    Ok(())
}

/// Projects a prayer point over the built-in background (or clears it with `None`).
#[tauri::command]
pub fn set_current_prayer(
    app: AppHandle,
    state: State<AppState>,
    prayer: Option<PrayerPoint>,
) -> Result<(), AppError> {
    *state
        .current_prayer
        .lock()
        .map_err(|_| AppError::new("current_prayer lock poisoned"))? = prayer;
    *state
        .current_image
        .lock()
        .map_err(|_| AppError::new("current_image lock poisoned"))? = None;
    *state
        .current_video
        .lock()
        .map_err(|_| AppError::new("current_video lock poisoned"))? = None;
    *state
        .is_blackout
        .lock()
        .map_err(|_| AppError::new("is_blackout lock poisoned"))? = false;

    app.emit(PROJECTION_CHANGED_EVENT, snapshot(&state)?)?;
    Ok(())
}

/// Projects a video of the folder last listed by `list_videos`. Selecting the video
/// that is already on screen restarts it (the serial changes either way).
#[tauri::command]
pub fn set_current_video(
    app: AppHandle,
    state: State<AppState>,
    name: Option<String>,
) -> Result<(), AppError> {
    *state
        .current_video
        .lock()
        .map_err(|_| AppError::new("current_video lock poisoned"))? = name;
    *state
        .current_prayer
        .lock()
        .map_err(|_| AppError::new("current_prayer lock poisoned"))? = None;
    *state
        .current_image
        .lock()
        .map_err(|_| AppError::new("current_image lock poisoned"))? = None;
    *state
        .is_blackout
        .lock()
        .map_err(|_| AppError::new("is_blackout lock poisoned"))? = false;
    {
        let mut serial = state
            .video_serial
            .lock()
            .map_err(|_| AppError::new("video_serial lock poisoned"))?;
        *serial += 1;
    }

    app.emit(PROJECTION_CHANGED_EVENT, snapshot(&state)?)?;
    Ok(())
}

#[tauri::command]
pub fn toggle_video_loop(app: AppHandle, state: State<AppState>) -> Result<bool, AppError> {
    let mut video_loop = state
        .video_loop
        .lock()
        .map_err(|_| AppError::new("video_loop lock poisoned"))?;
    *video_loop = !*video_loop;
    let active = *video_loop;
    drop(video_loop);

    app.emit(PROJECTION_CHANGED_EVENT, snapshot(&state)?)?;
    Ok(active)
}

#[tauri::command]
pub fn toggle_video_mute(app: AppHandle, state: State<AppState>) -> Result<bool, AppError> {
    let mut video_muted = state
        .video_muted
        .lock()
        .map_err(|_| AppError::new("video_muted lock poisoned"))?;
    *video_muted = !*video_muted;
    let active = *video_muted;
    drop(video_muted);

    app.emit(PROJECTION_CHANGED_EVENT, snapshot(&state)?)?;
    Ok(active)
}

#[tauri::command]
pub fn toggle_blackout(app: AppHandle, state: State<AppState>) -> Result<bool, AppError> {
    let mut blackout = state
        .is_blackout
        .lock()
        .map_err(|_| AppError::new("is_blackout lock poisoned"))?;
    *blackout = !*blackout;
    let active = *blackout;
    drop(blackout);

    app.emit(PROJECTION_CHANGED_EVENT, snapshot(&state)?)?;
    Ok(active)
}
