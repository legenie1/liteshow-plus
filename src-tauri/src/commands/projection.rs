use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::error::AppError;
use crate::state::AppState;

const PROJECTION_CHANGED_EVENT: &str = "projection-changed";

#[derive(Debug, Clone, Serialize)]
pub struct ProjectionState {
    pub image: Option<String>,
    pub blackout: bool,
}

fn snapshot(state: &State<AppState>) -> Result<ProjectionState, AppError> {
    let image = state
        .current_image
        .lock()
        .map_err(|_| AppError::new("current_image lock poisoned"))?
        .clone();
    let blackout = *state
        .is_blackout
        .lock()
        .map_err(|_| AppError::new("is_blackout lock poisoned"))?;
    Ok(ProjectionState { image, blackout })
}

#[tauri::command]
pub fn get_projection_state(state: State<AppState>) -> Result<ProjectionState, AppError> {
    snapshot(&state)
}

/// Selecting a new image (or clearing it) also cancels blackout, matching the
/// operator expectation that clicking a thumbnail always shows something.
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
        .is_blackout
        .lock()
        .map_err(|_| AppError::new("is_blackout lock poisoned"))? = false;

    app.emit(PROJECTION_CHANGED_EVENT, snapshot(&state)?)?;
    Ok(())
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
