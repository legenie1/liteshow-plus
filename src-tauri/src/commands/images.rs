use std::fs;
use std::path::Path;

use serde::Serialize;

use crate::error::AppError;
use crate::imaging::{mime_for_extension, to_data_uri};

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

#[tauri::command]
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

    images.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(images)
}

/// Returns the original file as a base64 data URI, unmodified (no resize/re-encode),
/// so the projection window renders it at full quality.
#[tauri::command]
pub fn get_full_image(path: String) -> Result<String, AppError> {
    let bytes = fs::read(&path)?;
    let mime = mime_for_extension(Path::new(&path));
    Ok(to_data_uri(&bytes, mime))
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
