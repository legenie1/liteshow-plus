use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

use crate::error::AppError;
use crate::imaging::to_data_uri;

const THUMBNAIL_MAX_SIDE: u32 = 200;

fn cache_key(path: &Path, modified_secs: u64, len: u64) -> String {
    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    modified_secs.hash(&mut hasher);
    len.hash(&mut hasher);
    format!("{:016x}.jpg", hasher.finish())
}

fn thumbnail_cache_dir(app: &AppHandle) -> Result<PathBuf, AppError> {
    let dir = app.path().app_cache_dir()?.join("thumbnails");
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Returns a small JPEG thumbnail of `path` as a base64 data URI, generating and
/// caching it on disk on first request. Re-requesting the same path only regenerates
/// the thumbnail if the file's mtime/size changed.
#[tauri::command(async)]
pub fn get_thumbnail(app: AppHandle, path: String) -> Result<String, AppError> {
    let source = Path::new(&path);
    let metadata = fs::metadata(source)?;
    let modified_secs = metadata
        .modified()?
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let cache_dir = thumbnail_cache_dir(&app)?;
    let cache_file = cache_dir.join(cache_key(source, modified_secs, metadata.len()));

    let bytes = if cache_file.exists() {
        fs::read(&cache_file)?
    } else {
        let image = image::open(source)?;
        let thumbnail = image.thumbnail(THUMBNAIL_MAX_SIDE, THUMBNAIL_MAX_SIDE);
        let rgb = thumbnail.to_rgb8();
        rgb.save(&cache_file)?;
        fs::read(&cache_file)?
    };

    Ok(to_data_uri(&bytes, "image/jpeg"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cache_key_changes_when_file_changes() {
        let path = Path::new("/tmp/slide.jpg");
        let key_a = cache_key(path, 1000, 500);
        let key_b = cache_key(path, 1001, 500);
        let key_c = cache_key(path, 1000, 501);

        assert_ne!(key_a, key_b);
        assert_ne!(key_a, key_c);
        assert!(key_a.ends_with(".jpg"));
    }

    #[test]
    fn cache_key_stable_for_same_input() {
        let path = Path::new("/tmp/slide.jpg");
        assert_eq!(cache_key(path, 1000, 500), cache_key(path, 1000, 500));
    }
}
