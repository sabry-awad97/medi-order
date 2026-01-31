use std::sync::Arc;

use derive_getters::Getters;
use sea_orm::{ConnectOptions, Database, DatabaseConnection};
use typed_builder::TypedBuilder;

use db_migration::run_migrations;

mod inventory;
mod onboarding;
mod settings;
mod staff;
mod user;

mod error;
pub use error::{ServiceError, ServiceResult};

mod jwt;
pub use jwt::{Claims, JwtError, JwtService};

mod pagination;
pub use pagination::{PaginationParams, PaginationResult};

// Export Staff service
pub use staff::{StaffService, StaffStatistics};

// Export User service
pub use user::{UserService, UserStatistics};

// Export Onboarding service
pub use onboarding::OnboardingService;

// Export Settings service
pub use settings::{SettingsService, SettingsStatistics};

// Export Inventory service
pub use inventory::{InventoryService, InventoryStatistics};

/// Database connection configuration
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub connect_timeout: u64,
    pub idle_timeout: u64,
}

/// JWT service configuration
pub struct JwtConfig {
    pub secret: String,
    pub issuer: String,
    pub audience: String,
    pub expiration_hours: i64,
}

/// Service manager containing all application services
#[derive(Getters, TypedBuilder)]
pub struct ServiceManager {
    /// Thread-safe reference to database connection
    #[builder(setter(into))]
    db: Arc<DatabaseConnection>,

    /// Staff service
    #[builder(setter(into))]
    staff: Arc<StaffService>,

    /// User service
    #[builder(setter(into))]
    user: Arc<UserService>,

    /// Onboarding service
    #[builder(setter(into))]
    onboarding: Arc<OnboardingService>,

    /// Settings service
    #[builder(setter(into))]
    settings: Arc<SettingsService>,

    /// Inventory service
    #[builder(setter(into))]
    inventory: Arc<InventoryService>,
}

impl ServiceManager {
    /// Initialize service manager with database and JWT configuration
    pub async fn init(
        db_config: DatabaseConfig,
        jwt_config: JwtConfig,
    ) -> Result<Self, ServiceError> {
        // Build database connection options
        let mut opt = ConnectOptions::new(db_config.url);
        opt.max_connections(db_config.max_connections)
            .min_connections(db_config.min_connections)
            .connect_timeout(std::time::Duration::from_secs(db_config.connect_timeout))
            .idle_timeout(std::time::Duration::from_secs(db_config.idle_timeout))
            .sqlx_logging(true);

        // Connect to database
        let db = Database::connect(opt).await?;

        // Run migrations with error handling
        match run_migrations(&db).await {
            Ok(_) => {
                tracing::info!("Migrations completed successfully");
            }
            Err(e) => {
                tracing::warn!(
                    "Migration error (this might be expected if table already exists): {:?}",
                    e
                );
            }
        }

        // Create JWT service
        let jwt_service = JwtService::new(
            jwt_config.secret,
            jwt_config.issuer,
            jwt_config.audience,
            jwt_config.expiration_hours,
        )
        .expect("Failed to create JWT service");

        let db = Arc::new(db);
        let staff = Arc::new(StaffService::new(db.clone()));
        let jwt_service = Arc::new(jwt_service);
        let user = Arc::new(UserService::new(
            db.clone(),
            staff.clone(),
            jwt_service.clone(),
        ));
        let onboarding = Arc::new(OnboardingService::new(user.clone()));
        let settings = Arc::new(SettingsService::new(db.clone()));
        let inventory = Arc::new(InventoryService::new(db.clone()));

        Ok(Self::builder()
            .db(db.clone())
            .staff(staff)
            .user(user)
            .onboarding(onboarding)
            .settings(settings)
            .inventory(inventory)
            .build())
    }
}
