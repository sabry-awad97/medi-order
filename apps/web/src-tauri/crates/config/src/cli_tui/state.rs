use crate::AppConfig;
use std::path::PathBuf;

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
    pub message: Option<(String, MessageType)>,
    pub edit_field: Option<EditField>,
    pub edit_buffer: String,
    pub editing: bool,
}

impl AppState {
    pub fn new(config_dir: PathBuf) -> Self {
        Self {
            screen: Screen::Main,
            selected_menu: 0,
            config: AppConfig::load_or_default(config_dir.clone()),
            config_dir,
            message: None,
            edit_field: None,
            edit_buffer: String::new(),
            editing: false,
        }
    }
}
