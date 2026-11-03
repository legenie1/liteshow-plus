use base64::{engine::general_purpose::STANDARD, Engine};

pub fn to_data_uri(bytes: &[u8], mime: &str) -> String {
    format!("data:{mime};base64,{}", STANDARD.encode(bytes))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wraps_bytes_as_data_uri() {
        let uri = to_data_uri(b"hi", "image/png");
        assert_eq!(uri, "data:image/png;base64,aGk=");
    }
}
