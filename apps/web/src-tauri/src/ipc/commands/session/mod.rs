use db_entity::session::dto::*;
use tap::TapFallible;
use tauri::{AppHandle, Manager};

use crate::{
    error::AppResult,
    ipc::{
        params::{CreateParams, GetParams},
        response::IpcResponse,
    },
    state::AppState,
};

// ============================================================================
// Helper Functions
// ============================================================================

/// Helper to get session service from app state
#[inline]
fn get_session_service(app: &AppHandle) -> std::sync::Arc<db_service::SessionService> {
    let state = app.state::<AppState>();
    let service_manager = state.service_manager();
    service_manager.session().clone()
}

// ============================================================================
// Session Commands
// ============================================================================

/// Validate a session token (mutation - updates last_activity_at)
#[tauri::command]
pub async fn validate_session(
    app: AppHandle,
    params: CreateParams<SessionToken>,
) -> IpcResponse<SessionResponse> {
    let result: AppResult<SessionResponse> = async {
        get_session_service(&app)
            .validate_session(&params.data().token)
            .await
            .tap_ok(|session| tracing::debug!("Validated session for user: {}", session.user_id))
            .tap_err(|e| tracing::error!("Failed to validate session: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Delete a session (logout)
#[tauri::command]
pub async fn logout_session(app: AppHandle, params: CreateParams<SessionToken>) -> IpcResponse<()> {
    let result: AppResult<()> = async {
        get_session_service(&app)
            .delete_session(&params.data().token)
            .await
            .tap_ok(|_| tracing::info!("User logged out"))
            .tap_err(|e| tracing::error!("Failed to logout: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Delete all sessions for a user
#[tauri::command]
pub async fn logout_all_sessions(app: AppHandle, params: GetParams) -> IpcResponse<u64> {
    let result: AppResult<u64> = async {
        let user_id = *params.id();
        get_session_service(&app)
            .delete_user_sessions(user_id)
            .await
            .tap_ok(|count| tracing::info!("Logged out {} sessions for user: {}", count, user_id))
            .tap_err(|e| tracing::error!("Failed to logout all sessions: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get all active sessions for a user
#[tauri::command]
pub async fn get_user_sessions(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<Vec<SessionResponse>> {
    let result: AppResult<Vec<SessionResponse>> = async {
        let user_id = *params.id();
        get_session_service(&app)
            .get_user_sessions(user_id)
            .await
            .tap_ok(|sessions| {
                tracing::debug!(
                    "Retrieved {} sessions for user: {}",
                    sessions.len(),
                    user_id
                )
            })
            .tap_err(|e| tracing::error!("Failed to get user sessions: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Clean up expired sessions
#[tauri::command]
pub async fn cleanup_expired_sessions(app: AppHandle) -> IpcResponse<u64> {
    let result: AppResult<u64> = async {
        get_session_service(&app)
            .cleanup_expired_sessions()
            .await
            .tap_ok(|count| {
                if *count > 0 {
                    tracing::info!("Cleaned up {} expired sessions", count)
                }
            })
            .tap_err(|e| tracing::error!("Failed to cleanup expired sessions: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}
