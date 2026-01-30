//! Error types for configuration management

use thiserror::Error;

/// Result type for configuration operations
pub type Result<T> = std::result::Result<T, ConfigError>;

/// Configuration error types
#[derive(Debug, Error)]
pub enum ConfigError {
    /// IO error
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    /// Encryption error
    #[error("Encryption error: {0}")]
    Encryption(String),

    /// Decryption error
    #[error("Decryption error: {0}")]
    Decryption(String),

    /// Invalid configuration
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),

    /// Configuration not found
    #[error("Configuration not found")]
    NotFound,
}
