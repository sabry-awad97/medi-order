use std::sync::Arc;

use db_entity::user::dto::{FirstRunSetupDto, LoginResponseDto};
use tap::TapFallible;

use crate::{
    error::{ServiceError, ServiceResult},
    user::UserService,
};

/// Onboarding service for managing first-run setup and initial configuration
///
/// This service orchestrates the onboarding process by coordinating with other services
/// to set up the initial application state, create admin users, and configure defaults.
pub struct OnboardingService {
    user_service: Arc<UserService>,
}

impl OnboardingService {
    /// Create a new onboarding service
    pub fn new(user_service: Arc<UserService>) -> Self {
        Self { user_service }
    }

    /// Check if this is the first run (no users exist)
    pub async fn is_first_run(&self) -> ServiceResult<bool> {
        let stats = self.user_service.get_statistics().await?;
        Ok(stats.total == 0)
    }

    /// Complete first-run setup with custom admin credentials
    ///
    /// This method orchestrates the entire first-run setup process:
    /// 1. Validates that it's actually the first run
    /// 2. Creates the initial admin user with custom credentials
    /// 3. Automatically logs in the new admin user
    /// 4. Returns the login response with token
    ///
    /// # Arguments
    /// * `dto` - First-run setup data with admin credentials
    ///
    /// # Returns
    /// * `LoginResponseDto` - Login response with user info and JWT token
    pub async fn complete_first_run_setup(
        &self,
        dto: FirstRunSetupDto,
    ) -> ServiceResult<LoginResponseDto> {
        tracing::info!("Starting first-run setup process");

        // Verify this is actually the first run
        if !self.is_first_run().await? {
            return Err(ServiceError::Conflict(
                "First-run setup already completed. Users already exist.".to_string(),
            ));
        }

        // Create initial admin user with custom credentials
        let _admin_user = self
            .user_service
            .create_initial_admin_custom(dto.clone())
            .await
            .tap_ok(|user| {
                tracing::info!(
                    "First-run admin user created: {} ({})",
                    user.username,
                    user.id
                )
            })
            .tap_err(|e| tracing::error!("Failed to create first-run admin user: {}", e))?;

        // Auto-login the new admin user
        let login_dto = db_entity::user::dto::LoginDto {
            username: dto.username,
            password: dto.password,
        };

        let login_response = self
            .user_service
            .login(login_dto)
            .await
            .tap_ok(|_| tracing::info!("First-run admin user auto-logged in"))
            .tap_err(|e| tracing::error!("Failed to auto-login first-run admin: {}", e))?;

        tracing::info!("First-run setup completed successfully");

        Ok(login_response)
    }

    /// Complete first-run setup with default admin credentials
    ///
    /// This is a convenience method for automated setups or testing.
    /// Creates an admin user with default credentials (admin/admin123).
    pub async fn complete_first_run_setup_default(&self) -> ServiceResult<LoginResponseDto> {
        tracing::info!("Starting first-run setup with default credentials");

        // Verify this is actually the first run
        if !self.is_first_run().await? {
            return Err(ServiceError::Conflict(
                "First-run setup already completed. Users already exist.".to_string(),
            ));
        }

        // Create initial admin user with default credentials
        let _admin_user = self
            .user_service
            .create_initial_admin()
            .await
            .tap_ok(|user| {
                tracing::info!(
                    "Default first-run admin user created: {} ({})",
                    user.username,
                    user.id
                )
            })
            .tap_err(|e| tracing::error!("Failed to create default first-run admin: {}", e))?;

        // Auto-login with default credentials
        let login_dto = db_entity::user::dto::LoginDto {
            username: "admin".to_string(),
            password: "admin123".to_string(),
        };

        let login_response = self
            .user_service
            .login(login_dto)
            .await
            .tap_ok(|_| tracing::info!("Default first-run admin user auto-logged in"))
            .tap_err(|e| tracing::error!("Failed to auto-login default admin: {}", e))?;

        tracing::info!("First-run setup with default credentials completed successfully");

        Ok(login_response)
    }

    // Future extension points:
    // - setup_organization_settings(&self, settings: OrganizationSettings)
    // - setup_initial_suppliers(&self, suppliers: Vec<SupplierDto>)
    // - setup_initial_inventory(&self, inventory: Vec<InventoryDto>)
    // - import_initial_data(&self, data: InitialDataImport)
    // - configure_integrations(&self, integrations: IntegrationConfig)
}
