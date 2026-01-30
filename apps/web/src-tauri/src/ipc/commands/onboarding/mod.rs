use db_entity::user::dto::{FirstRunSetupDto, LoginResponseDto};
use tap::TapFallible;
use tauri::{AppHandle, Manager};

use crate::{
    error::AppResult,
    ipc::{params::CreateParams, response::IpcResponse},
    state::AppState,
};

// ============================================================================
// Helper Functions
// ============================================================================

/// Helper to get onboarding service from app state
#[inline]
fn get_onboarding_service(app: &AppHandle) -> std::sync::Arc<db_service::OnboardingService> {
    let state = app.state::<AppState>();
    let service_manager = state.service_manager();
    service_manager.onboarding().clone()
}

// ============================================================================
// First-Run Check Commands
// ============================================================================

/// Check if this is the first run of the application
///
/// Returns true if no users exist in the database, indicating first-run setup is needed.
#[tauri::command]
pub async fn check_first_run(app: AppHandle) -> IpcResponse<bool> {
    let result: AppResult<bool> = async {
        // Check database state only
        let is_first_run = get_onboarding_service(&app)
            .is_first_run()
            .await
            .tap_err(|e| tracing::error!("Failed to check database first-run state: {}", e))?;

        tracing::debug!("First run check - DB: {}", is_first_run);

        Ok(is_first_run)
    }
    .await;
    result.into()
}

// ============================================================================
// First-Run Setup Commands
// ============================================================================

/// Complete first-run setup by creating initial admin user with custom credentials
///
/// This command orchestrates the entire first-run setup process:
/// 1. Validates that it's actually the first run
/// 2. Creates the initial admin user with provided credentials
/// 3. Automatically logs in the new admin user
/// 4. Returns login response with JWT token
///
/// # Arguments
/// * `params` - CreateParams containing FirstRunSetupDto with admin credentials
///
/// # Returns
/// * `LoginResponseDto` - Login response with user info and JWT token
#[tauri::command]
pub async fn complete_first_run_setup(
    app: AppHandle,
    params: CreateParams<FirstRunSetupDto>,
) -> IpcResponse<LoginResponseDto> {
    let result: AppResult<LoginResponseDto> = async {
        tracing::info!("Starting first-run setup via IPC command");

        // Complete first-run setup using onboarding service
        let login_response = get_onboarding_service(&app)
            .complete_first_run_setup(params.data().clone())
            .await
            .tap_ok(|response| {
                tracing::info!(
                    "First-run setup completed successfully for user: {}",
                    response.user.username
                )
            })
            .tap_err(|e| tracing::error!("Failed to complete first-run setup: {}", e))?;

        Ok(login_response)
    }
    .await;
    result.into()
}

/// Complete first-run setup with default credentials (admin/admin123)
///
/// This is a convenience command for automated setups or testing.
/// Creates an admin user with default credentials and auto-logs them in.
#[tauri::command]
pub async fn complete_first_run_setup_default(app: AppHandle) -> IpcResponse<LoginResponseDto> {
    let result: AppResult<LoginResponseDto> = async {
        tracing::info!("Starting first-run setup with default credentials");

        // Complete first-run setup with defaults
        let login_response = get_onboarding_service(&app)
            .complete_first_run_setup_default()
            .await
            .tap_ok(|response| {
                tracing::info!(
                    "First-run setup with defaults completed for user: {}",
                    response.user.username
                )
            })
            .tap_err(|e| {
                tracing::error!("Failed to complete first-run setup with defaults: {}", e)
            })?;

        Ok(login_response)
    }
    .await;
    result.into()
}
