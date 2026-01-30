//! Configuration storage and persistence

use crate::AppConfig;
use crate::crypto::SecureStorage;
use crate::error::{ConfigError, Result};
use std::fs;
use std::path::PathBuf;

/// Configuration storage manager
#[derive(Clone)]
pub struct ConfigStorage {
    app_name: String,
    config_dir: Option<PathBuf>,
    secure_storage: SecureStorage,
}

impl ConfigStorage {
    /// Create a new configuration storage
    pub fn new(app_name: &str) -> Result<Self> {
        Ok(Self {
            app_name: app_name.to_string(),
            config_dir: None,
            secure_storage: SecureStorage::new()?,
        })
    }

    /// Create a new configuration storage with custom path
    pub fn new_with_path(app_name: &str, config_dir: PathBuf) -> Result<Self> {
        Ok(Self {
            app_name: app_name.to_string(),
            config_dir: Some(config_dir),
            secure_storage: SecureStorage::new()?,
        })
    }

    /// Load configuration from storage
    pub fn load(&self) -> Result<AppConfig> {
        let config_path = self.get_config_path_internal()?;

        if !config_path.exists() {
            return Err(ConfigError::NotFound);
        }

        // Read encrypted configuration
        let encrypted_data = fs::read_to_string(&config_path).map_err(ConfigError::Io)?;

        // Decrypt configuration
        let decrypted_data = self.secure_storage.decrypt(&encrypted_data)?;

        // Deserialize configuration
        let mut config: AppConfig =
            serde_json::from_str(&decrypted_data).map_err(ConfigError::Serialization)?;

        // Set app name (not serialized)
        config.app_name = self.app_name.clone();

        tracing::debug!("Loaded configuration from: {}", config_path.display());
        Ok(config)
    }

    /// Get config path (internal method that respects custom path)
    fn get_config_path_internal(&self) -> Result<PathBuf> {
        let dir = self.config_dir.as_ref().ok_or_else(|| {
            ConfigError::InvalidConfig("Config directory not provided".to_string())
        })?;
        Ok(dir.join("config.enc"))
    }

    /// Save configuration to storage
    pub fn save(&self, config: &AppConfig) -> Result<()> {
        let config_path = self.get_config_path_internal()?;

        // Create parent directory if it doesn't exist
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent).map_err(ConfigError::Io)?;
        }

        // Serialize configuration
        let json_data = serde_json::to_string_pretty(config).map_err(ConfigError::Serialization)?;

        // Encrypt configuration
        let encrypted_data = self.secure_storage.encrypt(&json_data)?;

        // Write to file
        fs::write(&config_path, encrypted_data).map_err(ConfigError::Io)?;

        Ok(())
    }

    /// Delete configuration from storage
    pub fn delete(&self) -> Result<()> {
        let config_path = self.get_config_path_internal()?;

        if config_path.exists() {
            fs::remove_file(&config_path).map_err(ConfigError::Io)?;
            tracing::info!("Deleted configuration: {}", config_path.display());
        }

        Ok(())
    }

    /// Check if configuration exists
    pub fn exists(&self) -> bool {
        self.get_config_path_internal()
            .map(|path| path.exists())
            .unwrap_or(false)
    }

    /// Export configuration to a file (unencrypted, for debugging)
    pub fn export_plain(&self, path: &PathBuf) -> Result<()> {
        let config = self.load()?;
        let json_data =
            serde_json::to_string_pretty(&config).map_err(ConfigError::Serialization)?;

        fs::write(path, json_data).map_err(ConfigError::Io)?;

        tracing::info!("Exported configuration to: {}", path.display());
        Ok(())
    }

    /// Import configuration from a file
    pub fn import(&self, path: &PathBuf) -> Result<AppConfig> {
        let json_data = fs::read_to_string(path).map_err(ConfigError::Io)?;

        let mut config: AppConfig =
            serde_json::from_str(&json_data).map_err(ConfigError::Serialization)?;

        config.app_name = self.app_name.clone();

        // Save imported configuration
        self.save(&config)?;

        tracing::info!("Imported configuration from: {}", path.display());
        Ok(config)
    }
}
