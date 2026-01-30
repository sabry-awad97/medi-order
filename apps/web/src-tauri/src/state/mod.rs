use derive_getters::Getters;
use tauri::Manager;
use typed_builder::TypedBuilder;

use crate::error::{AppError, AppResult};

/// Application state container
#[derive(TypedBuilder, Getters)]
pub struct AppState {
    #[builder(setter(into))]
    service_manager: db_service::ServiceManager,
}

/// Initialize application state
///
/// # Arguments
/// * `app_handle` - Tauri application handle for path resolution
///
/// # Returns
/// * `AppResult<AppState>` - Initialized application state or error
#[tracing::instrument(skip(app_handle))]
pub async fn try_init_state(app_handle: &tauri::AppHandle) -> AppResult<AppState> {
    // Get app config directory
    let config_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| AppError::ParseError(format!("Failed to get app config directory: {}", e)))?;

    // Load application configuration from storage or use defaults
    let config = app_config::AppConfig::load_or_default(config_dir);

    tracing::info!("Configuration loaded successfully");
    tracing::info!("Database: {}", config.database().safe_repr());

    // Prepare database configuration
    let db_config = db_service::DatabaseConfig {
        url: config.database.connection_url(),
        max_connections: config.database.max_connections,
        min_connections: config.database.min_connections,
        connect_timeout: config.database.connect_timeout,
        idle_timeout: config.database.idle_timeout,
    };

    // Prepare JWT configuration
    let jwt_config = db_service::JwtConfig {
        secret: config.jwt.secret,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
        expiration_hours: config.jwt.expiration_hours,
    };

    let service_manager = db_service::ServiceManager::init(db_config, jwt_config).await?;
    Ok(AppState::builder().service_manager(service_manager).build())
}
