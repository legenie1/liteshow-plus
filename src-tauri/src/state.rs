use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Default)]
pub struct AppState {
    pub current_image: Mutex<Option<String>>,
    pub is_blackout: Mutex<bool>,
    /// Repeat mode for videos; kept across selections, like an operator setting.
    pub video_loop: Mutex<bool>,
    /// Mutes the projected video's sound; kept across selections, like `video_loop`.
    pub video_muted: Mutex<bool>,
    /// Folder last listed by `list_videos`: the only place the video protocol reads from.
    pub video_folder: Mutex<Option<PathBuf>>,
    /// File name (not path) of the projected video, inside `video_folder`.
    pub current_video: Mutex<Option<String>>,
    /// Bumped on every video selection so that picking the same video again restarts it.
    pub video_serial: Mutex<u64>,
}
