use std::fs::{self, File};
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::http::{header, Request, Response, StatusCode};
use tauri::{AppHandle, Emitter, Manager};

use crate::commands::images::natural_cmp;
use crate::error::AppError;
use crate::state::AppState;

pub const VIDEO_SCHEME: &str = "lsvideo";

const SUPPORTED_EXTENSIONS: [&str; 4] = ["mp4", "m4v", "mov", "webm"];
const VIDEO_CONTROL_EVENT: &str = "video-control";

/// Upper bound for one response. The webview asks for `bytes=0-` and reads as much as
/// it needs: answering with a slice keeps a 2 GB video out of memory.
const MAX_CHUNK: u64 = 4 * 1024 * 1024;

#[derive(Debug, Serialize, PartialEq)]
pub struct VideoFile {
    pub name: String,
}

fn is_supported_video(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| SUPPORTED_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

fn content_type(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_lowercase())
        .as_deref()
    {
        Some("webm") => "video/webm",
        // QuickTime files with H.264 play as MP4 in Chromium.
        _ => "video/mp4",
    }
}

/// Resolves a bare file name to a video inside `folder`. Anything that could leave
/// the folder (separators, drive prefixes, `..`) is refused, so the frontend can
/// never use the protocol to read an arbitrary file.
fn resolve_video(folder: &Path, name: &str) -> Option<PathBuf> {
    if name.is_empty() || name == ".." || name.contains(['/', '\\', ':']) {
        return None;
    }
    let path = folder.join(name);
    (is_supported_video(&path) && path.is_file()).then_some(path)
}

fn percent_decode(input: &str) -> Option<String> {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' {
            let hex = input.get(i + 1..i + 3)?;
            out.push(u8::from_str_radix(hex, 16).ok()?);
            i += 3;
        } else {
            out.push(bytes[i]);
            i += 1;
        }
    }
    String::from_utf8(out).ok()
}

/// Parses a single `Range` header into an inclusive `(start, end)` clamped to the
/// file and to `MAX_CHUNK`. `None` means unsatisfiable.
fn parse_range(header: Option<&str>, len: u64) -> Option<(u64, u64)> {
    if len == 0 {
        return None;
    }
    let (start, end) = match header {
        None => (0, len - 1),
        Some(header) => {
            let spec = header.strip_prefix("bytes=")?;
            let (from, to) = spec.split_once('-')?;
            if from.is_empty() {
                let suffix: u64 = to.parse().ok()?;
                (len.saturating_sub(suffix), len - 1)
            } else {
                let start: u64 = from.parse().ok()?;
                let end = if to.is_empty() {
                    len - 1
                } else {
                    to.parse::<u64>().ok()?.min(len - 1)
                };
                (start, end)
            }
        }
    };
    if start > end || start >= len {
        return None;
    }
    Some((start, end.min(start + MAX_CHUNK - 1)))
}

fn error_response(status: StatusCode) -> Response<Vec<u8>> {
    Response::builder()
        .status(status)
        .body(Vec::new())
        .unwrap_or_default()
}

fn serve_video(app: &AppHandle, request: &Request<Vec<u8>>) -> Response<Vec<u8>> {
    let state = app.state::<AppState>();
    let Some(folder) = state.video_folder.lock().ok().and_then(|f| f.clone()) else {
        return error_response(StatusCode::NOT_FOUND);
    };
    let Some(path) = percent_decode(request.uri().path().trim_start_matches('/'))
        .and_then(|name| resolve_video(&folder, &name))
    else {
        return error_response(StatusCode::NOT_FOUND);
    };

    let read = || -> std::io::Result<Response<Vec<u8>>> {
        let mut file = File::open(&path)?;
        let len = file.metadata()?.len();
        let range = request
            .headers()
            .get(header::RANGE)
            .and_then(|value| value.to_str().ok());
        let Some((start, end)) = parse_range(range, len) else {
            return Ok(Response::builder()
                .status(StatusCode::RANGE_NOT_SATISFIABLE)
                .header(header::CONTENT_RANGE, format!("bytes */{len}"))
                .body(Vec::new())
                .unwrap_or_default());
        };

        let mut body = vec![0; (end - start + 1) as usize];
        file.seek(SeekFrom::Start(start))?;
        file.read_exact(&mut body)?;

        Ok(Response::builder()
            .status(StatusCode::PARTIAL_CONTENT)
            .header(header::CONTENT_TYPE, content_type(&path))
            .header(header::ACCEPT_RANGES, "bytes")
            .header(header::CONTENT_RANGE, format!("bytes {start}-{end}/{len}"))
            .body(body)
            .unwrap_or_default())
    };

    read().unwrap_or_else(|_| error_response(StatusCode::INTERNAL_SERVER_ERROR))
}

/// Serves the files of the folder picked in the "Vidéos" tab to the webviews, with
/// Range support (seeking, and playback starting before the file is read).
pub fn register_protocol(builder: tauri::Builder<tauri::Wry>) -> tauri::Builder<tauri::Wry> {
    builder.register_asynchronous_uri_scheme_protocol(VIDEO_SCHEME, |ctx, request, responder| {
        let app = ctx.app_handle().clone();
        // Reading from disk must not block the webview's UI thread.
        std::thread::spawn(move || responder.respond(serve_video(&app, &request)));
    })
}

#[tauri::command(async)]
pub fn list_videos(
    state: tauri::State<AppState>,
    folder: String,
) -> Result<Vec<VideoFile>, AppError> {
    let mut videos: Vec<VideoFile> = fs::read_dir(&folder)?
        .filter_map(|entry| entry.ok())
        .map(|entry| entry.path())
        .filter(|path| path.is_file() && is_supported_video(path))
        .filter_map(|path| {
            let name = path.file_name()?.to_str()?.to_string();
            Some(VideoFile { name })
        })
        .collect();

    videos.sort_by(|a, b| natural_cmp(&a.name, &b.name));

    *state
        .video_folder
        .lock()
        .map_err(|_| AppError::new("video_folder lock poisoned"))? = Some(PathBuf::from(folder));
    Ok(videos)
}

/// Asks the projection window to play/pause the current video.
#[tauri::command]
pub fn toggle_video_playback(app: AppHandle) -> Result<(), AppError> {
    app.emit(VIDEO_CONTROL_EVENT, "toggle")?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_known_video_extensions() {
        assert!(is_supported_video(Path::new("intro.mp4")));
        assert!(is_supported_video(Path::new("intro.WEBM")));
        assert!(is_supported_video(Path::new("intro.mov")));
        assert!(!is_supported_video(Path::new("intro.avi")));
        assert!(!is_supported_video(Path::new("slide.png")));
    }

    #[test]
    fn decodes_percent_escapes() {
        assert_eq!(
            percent_decode("Intro%20%C3%A9t%C3%A9.mp4").as_deref(),
            Some("Intro été.mp4")
        );
        assert_eq!(percent_decode("bad%2").as_deref(), None);
        assert_eq!(percent_decode("bad%zz").as_deref(), None);
    }

    #[test]
    fn range_without_header_starts_at_zero() {
        assert_eq!(parse_range(None, 100), Some((0, 99)));
    }

    #[test]
    fn range_forms() {
        assert_eq!(parse_range(Some("bytes=10-19"), 100), Some((10, 19)));
        assert_eq!(parse_range(Some("bytes=90-"), 100), Some((90, 99)));
        assert_eq!(parse_range(Some("bytes=-10"), 100), Some((90, 99)));
        assert_eq!(parse_range(Some("bytes=50-500"), 100), Some((50, 99)));
    }

    #[test]
    fn range_is_capped_to_one_chunk() {
        let len = MAX_CHUNK * 3;
        assert_eq!(parse_range(Some("bytes=0-"), len), Some((0, MAX_CHUNK - 1)));
    }

    #[test]
    fn rejects_unsatisfiable_ranges() {
        assert_eq!(parse_range(Some("bytes=100-"), 100), None);
        assert_eq!(parse_range(Some("bytes=20-10"), 100), None);
        assert_eq!(parse_range(Some("items=0-1"), 100), None);
        assert_eq!(parse_range(Some("bytes=0-1"), 0), None);
    }

    #[test]
    fn resolves_only_videos_inside_the_folder() {
        let dir = std::env::temp_dir().join(format!(
            "liteshow-video-test-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("intro.mp4"), b"x").unwrap();
        fs::write(dir.join("notes.txt"), b"x").unwrap();

        assert!(resolve_video(&dir, "intro.mp4").is_some());
        assert!(resolve_video(&dir, "notes.txt").is_none());
        assert!(resolve_video(&dir, "missing.mp4").is_none());
        assert!(resolve_video(&dir, "..").is_none());
        assert!(resolve_video(&dir, "../intro.mp4").is_none());
        assert!(resolve_video(&dir, "sub\\intro.mp4").is_none());
        assert!(resolve_video(&dir, "C:intro.mp4").is_none());
        assert!(resolve_video(&dir, "").is_none());

        fs::remove_dir_all(&dir).unwrap();
    }
}
