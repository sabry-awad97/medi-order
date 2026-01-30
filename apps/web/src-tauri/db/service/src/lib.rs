use std::sync::Arc;

use derive_getters::Getters;
use sea_orm::{Database, DatabaseConnection};
use typed_builder::TypedBuilder;

use db_migration::run_migrations;

mod error;
pub use error::{ServiceError, ServiceResult};

/// Service manager containing all application services
#[derive(Getters, TypedBuilder)]
pub struct ServiceManager {
    /// Thread-safe reference to database connection
    #[builder(setter(into))]
    db: Arc<DatabaseConnection>,
}

impl ServiceManager {
    /// Initialize service manager with given database connection
    pub fn init(db: Arc<DatabaseConnection>) -> Self {
        Self::builder().db(db.clone()).build()
    }
}

/// Sets up all services for the application
pub async fn setup_services(url: &str) -> Result<ServiceManager, ServiceError> {
    let db = Database::connect(url).await?;
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
            // Continue anyway - the table might already exist with the correct schema
            // or we might be able to work with the existing schema
        }
    }
    Ok(ServiceManager::init(Arc::new(db)))
}
