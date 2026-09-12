use std::path::Path;

use base64::{engine::general_purpose::STANDARD, Engine};

pub fn mime_for_extension(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_lowercase())
        .as_deref()
    {
        Some("png") => "image/png",
        Some("webp") => "image/webp",
        _ => "image/jpeg",
    }
}

pub fn to_data_uri(bytes: &[u8], mime: &str) -> String {
    format!("data:{mime};base64,{}", STANDARD.encode(bytes))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_mime_from_extension() {
        assert_eq!(mime_for_extension(Path::new("a.png")), "image/png");
        assert_eq!(mime_for_extension(Path::new("a.WEBP")), "image/webp");
        assert_eq!(mime_for_extension(Path::new("a.jpg")), "image/jpeg");
        assert_eq!(mime_for_extension(Path::new("a.jpeg")), "image/jpeg");
        assert_eq!(mime_for_extension(Path::new("a")), "image/jpeg");
    }

    #[test]
    fn wraps_bytes_as_data_uri() {
        let uri = to_data_uri(b"hi", "image/png");
        assert_eq!(uri, "data:image/png;base64,aGk=");
    }
}
