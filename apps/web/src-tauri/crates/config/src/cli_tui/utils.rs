use std::path::PathBuf;

pub fn get_config_dir() -> PathBuf {
    std::env::var("MEDITRACK_CONFIG_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            dirs::config_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join("meditrack")
        })
}

pub fn mask_password(password: &str) -> String {
    if password.len() <= 4 {
        "****".to_string()
    } else {
        format!("{}****", &password[..2])
    }
}

pub fn validate_port(input: &str) -> Result<u16, String> {
    input
        .parse::<u16>()
        .map_err(|_| "Invalid port number".to_string())
}

pub fn validate_u32(input: &str) -> Result<u32, String> {
    input
        .parse::<u32>()
        .map_err(|_| "Invalid number".to_string())
}

pub fn validate_u64(input: &str) -> Result<u64, String> {
    input
        .parse::<u64>()
        .map_err(|_| "Invalid number".to_string())
}

pub fn validate_i64(input: &str) -> Result<i64, String> {
    input
        .parse::<i64>()
        .map_err(|_| "Invalid number".to_string())
}
