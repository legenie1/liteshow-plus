use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};

/// A prayer point typed by the operator, drawn over the built-in background.
/// Empty strings mean "not provided".
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct PrayerPoint {
    pub number: String,
    pub text: String,
    pub reference: String,
    pub verse: String,
    /// Which tab made the slide ("prayer", "bible", "dictionary", "lyrics"; empty =
    /// prayer). The windows read it to pick the background and the footer setting.
    #[serde(default)]
    pub kind: String,
    /// One block per translation, for the "split" Bible template; empty otherwise.
    #[serde(default)]
    pub passages: Vec<Passage>,
}

/// A translation's verses under their own label, e.g. "Genesis 1:16 (KJV)".
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct Passage {
    pub label: String,
    pub verse: String,
}

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
    /// Videos dropped onto the window from elsewhere, by the bare name the frontend
    /// uses for them. Cleared whenever a folder is listed.
    pub extra_videos: Mutex<HashMap<String, PathBuf>>,
    /// File name (not path) of the projected video: in `video_folder` or `extra_videos`.
    pub current_video: Mutex<Option<String>>,
    pub current_prayer: Mutex<Option<PrayerPoint>>,
    /// Bumped on every video selection so that picking the same video again restarts it.
    pub video_serial: Mutex<u64>,
}
