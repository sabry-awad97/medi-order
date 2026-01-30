use serde::{Deserialize, Serialize};

mod crypto;
mod database;
mod error;
mod storage;

pub mod cli_tui;

// Re-export types
pub use database::DatabaseConfig;
pub use error::{ConfigError, Result};
pub use storage::ConfigStorage;

/// Main application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// Application name (used for storage paths)
    #[serde(skip)]
    app_name: String,

    /// Database configuration
    #[serde(default)]
    pub database: DatabaseConfig,

    /// JWT configuration
    #[serde(default)]
    pub jwt: JwtConfig,
}

/// JWT configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtConfig {
    /// JWT secret key (should be changed in production)
    pub secret: String,

    /// JWT issuer
    pub issuer: String,

    /// JWT audience
    pub audience: String,

    /// Token expiration in hours
    pub expiration_hours: i64,
}

impl Default for JwtConfig {
    fn default() -> Self {
        Self {
            secret: "change-this-in-production-meditrack-secret-key".to_string(),
            issuer: "meditrack".to_string(),
            audience: "meditrack-app".to_string(),
            expiration_hours: 24,
        }
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            app_name: "meditrack".to_string(),
            database: DatabaseConfig::default(),
            jwt: JwtConfig::default(),
        }
    }
}

impl AppConfig {
    /// Load configuration from storage or create default if not found
    pub fn load_or_default(config_dir: std::path::PathBuf) -> Self {
        let storage = match ConfigStorage::new_with_path("meditrack", config_dir.clone()) {
            Ok(s) => s,
            Err(e) => {
                tracing::warn!("Failed to initialize config storage: {:?}", e);
                return Self::default();
            }
        };

        match storage.load() {
            Ok(config) => {
                tracing::info!("Loaded configuration from storage");
                config
            }
            Err(ConfigError::NotFound) => {
                tracing::info!("Configuration not found, creating default");
                let config = Self::default();

                // Try to save default config for next time
                if let Err(e) = storage.save(&config) {
                    tracing::warn!("Failed to save default configuration: {:?}", e);
                }

                config
            }
            Err(e) => {
                tracing::warn!("Failed to load configuration: {:?}, using defaults", e);
                Self::default()
            }
        }
    }

    /// Save configuration to storage
    pub fn save(&self, config_dir: std::path::PathBuf) -> Result<()> {
        let storage = ConfigStorage::new_with_path("meditrack", config_dir)?;
        storage.save(self)
    }
}
