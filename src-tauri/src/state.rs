use std::sync::Mutex;

#[derive(Default)]
pub struct AppState {
    pub current_image: Mutex<Option<String>>,
    pub is_blackout: Mutex<bool>,
}
