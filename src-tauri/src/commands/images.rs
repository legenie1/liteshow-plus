use std::cmp::Ordering;
use std::fs;
use std::path::Path;

use serde::Serialize;
use tauri::ipc::Response;

use crate::error::AppError;

const SUPPORTED_EXTENSIONS: [&str; 4] = ["jpg", "jpeg", "png", "webp"];

#[derive(Debug, Serialize, PartialEq)]
pub struct ImageFile {
    pub name: String,
    pub path: String,
}

fn is_supported_image(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| SUPPORTED_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

/// Returns the digit run starting at `start` without leading zeros, and its end index.
fn digit_run(bytes: &[u8], start: usize) -> (&[u8], usize) {
    let mut end = start;
    while end < bytes.len() && bytes[end].is_ascii_digit() {
        end += 1;
    }
    let mut first = start;
    while first < end && bytes[first] == b'0' {
        first += 1;
    }
    (&bytes[first..end], end)
}

/// Orders digit runs by numeric value, so "2.png" comes before "10.png".
fn natural_cmp(a: &str, b: &str) -> Ordering {
    let (a_bytes, b_bytes) = (a.as_bytes(), b.as_bytes());
    let (mut i, mut j) = (0, 0);

    while i < a_bytes.len() && j < b_bytes.len() {
        let (x, y) = (a_bytes[i], b_bytes[j]);
        let order = if x.is_ascii_digit() && y.is_ascii_digit() {
            let (a_run, next_i) = digit_run(a_bytes, i);
            let (b_run, next_j) = digit_run(b_bytes, j);
            i = next_i;
            j = next_j;
            a_run.len().cmp(&b_run.len()).then(a_run.cmp(b_run))
        } else {
            i += 1;
            j += 1;
            x.to_ascii_lowercase().cmp(&y.to_ascii_lowercase())
        };
        if order != Ordering::Equal {
            return order;
        }
    }

    (a_bytes.len() - i)
        .cmp(&(b_bytes.len() - j))
        .then_with(|| a.cmp(b))
}

#[tauri::command(async)]
pub fn list_images(folder: String) -> Result<Vec<ImageFile>, AppError> {
    let mut images: Vec<ImageFile> = fs::read_dir(&folder)?
        .filter_map(|entry| entry.ok())
        .map(|entry| entry.path())
        .filter(|path| path.is_file() && is_supported_image(path))
        .filter_map(|path| {
            let name = path.file_name()?.to_str()?.to_string();
            let path = path.to_str()?.to_string();
            Some(ImageFile { name, path })
        })
        .collect();

    images.sort_by(|a, b| natural_cmp(&a.name, &b.name));

    Ok(images)
}

/// Returns the original file as raw bytes, unmodified (no resize/re-encode), so the
/// projection window renders it at full quality. Slides can weigh over 10 MB: raw
/// bytes skip the base64 + JSON cost that made each click take over a second.
#[tauri::command(async)]
pub fn get_full_image(path: String) -> Result<Response, AppError> {
    Ok(Response::new(fs::read(&path)?))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_known_image_extensions() {
        assert!(is_supported_image(Path::new("slide.jpg")));
        assert!(is_supported_image(Path::new("slide.JPEG")));
        assert!(is_supported_image(Path::new("slide.png")));
        assert!(is_supported_image(Path::new("slide.WebP")));
    }

    #[test]
    fn rejects_unsupported_extensions() {
        assert!(!is_supported_image(Path::new("slide.gif")));
        assert!(!is_supported_image(Path::new("notes.txt")));
        assert!(!is_supported_image(Path::new("no_extension")));
    }

    #[test]
    fn sorts_numbers_by_value() {
        let mut names = vec!["10.png", "2.png", "1.png", "02b.png", "20__.png", "20_.png"];
        names.sort_by(|a, b| natural_cmp(a, b));
        assert_eq!(
            names,
            ["1.png", "2.png", "02b.png", "10.png", "20_.png", "20__.png"]
        );
    }

    #[test]
    fn lists_and_sorts_supported_images_only() {
        let dir = std::env::temp_dir().join(format!(
            "liteshow-test-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("b_slide.png"), b"").unwrap();
        fs::write(dir.join("a_slide.jpg"), b"").unwrap();
        fs::write(dir.join("readme.txt"), b"").unwrap();
        fs::create_dir_all(dir.join("subfolder")).unwrap();

        let result = list_images(dir.to_str().unwrap().to_string()).unwrap();

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].name, "a_slide.jpg");
        assert_eq!(result[1].name, "b_slide.png");

        fs::remove_dir_all(&dir).unwrap();
    }
}
