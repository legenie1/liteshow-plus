use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct AppError {
    message: String,
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError {
            message: err.to_string(),
        }
    }
}

impl From<image::ImageError> for AppError {
    fn from(err: image::ImageError) -> Self {
        AppError {
            message: err.to_string(),
        }
    }
}

impl From<tauri::Error> for AppError {
    fn from(err: tauri::Error) -> Self {
        AppError {
            message: err.to_string(),
        }
    }
}

impl AppError {
    pub fn new(message: impl Into<String>) -> Self {
        AppError {
            message: message.into(),
        }
    }
}
