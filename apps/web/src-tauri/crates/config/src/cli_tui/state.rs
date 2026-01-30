use crate::AppConfig;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug, PartialEq)]
pub enum Screen {
    Main,
    ViewConfig,
    EditDatabase,
    EditJwt,
    Export,
    Import,
    Confirm(ConfirmAction),
}

#[derive(Clone, Debug, PartialEq)]
pub enum ConfirmAction {
    Reset,
    Delete,
}

#[derive(Clone, Debug, PartialEq)]
pub enum MessageType {
    Success,
    Error,
    Info,
}

#[derive(Clone, Debug, PartialEq)]
pub enum EditField {
    DbHost,
    DbPort,
    DbName,
    DbUsername,
    DbPassword,
    DbMaxConn,
    DbMinConn,
    DbConnTimeout,
    DbIdleTimeout,
    JwtSecret,
    JwtIssuer,
    JwtAudience,
    JwtExpiration,
    FilePath,
}

#[derive(Clone, Debug)]
pub struct AppState {
    pub screen: Screen,
    pub selected_menu: usize,
    pub config: AppConfig,
    pub config_dir: PathBuf,
    pub password: String,
    pub message: Option<(String, MessageType)>,
    pub edit_field: Option<EditField>,
    pub edit_buffer: String,
    pub editing: bool,
}

impl AppState {
    pub fn new_with_password(config_dir: PathBuf, password: &str) -> Self {
        // Try to load config with password, or create default
        let config = Self::load_config_with_password(&config_dir, password);

        Self {
            screen: Screen::Main,
            selected_menu: 0,
            config,
            config_dir,
            password: password.to_string(),
            message: None,
            edit_field: None,
            edit_buffer: String::new(),
            editing: false,
        }
    }

    pub fn new(config_dir: PathBuf) -> Self {
        Self {
            screen: Screen::Main,
            selected_menu: 0,
            config: AppConfig::load_or_default(config_dir.clone()),
            config_dir,
            password: String::new(),
            message: None,
            edit_field: None,
            edit_buffer: String::new(),
            editing: false,
        }
    }

    fn load_config_with_password(config_dir: &Path, password: &str) -> AppConfig {
        use crate::ConfigStorage;

        match ConfigStorage::new_with_password("meditrack", config_dir.to_path_buf(), password) {
            Ok(storage) => match storage.load() {
                Ok(config) => {
                    tracing::info!("Loaded configuration from storage");
                    config
                }
                Err(crate::ConfigError::NotFound) => {
                    tracing::info!("Configuration not found, creating default");
                    AppConfig::default()
                }
                Err(e) => {
                    tracing::warn!("Failed to load configuration: {:?}, using defaults", e);
                    AppConfig::default()
                }
            },
            Err(e) => {
                tracing::warn!("Failed to initialize storage: {:?}, using defaults", e);
                AppConfig::default()
            }
        }
    }
}
