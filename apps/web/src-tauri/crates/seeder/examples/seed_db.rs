/// Example: How to use the seeder crate
///
/// Run with: cargo run --example seed_db
use app_seeder::Seeder;
use db_service::{DatabaseConfig, JwtConfig, ServiceManager};
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Get database URL from environment or use default
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://meditrack.db?mode=rwc".to_string());

    println!("Connecting to database: {}", database_url);

    // Configure database
    let db_config = DatabaseConfig {
        url: database_url,
        max_connections: 10,
        min_connections: 2,
        connect_timeout: 30,
        idle_timeout: 600,
    };

    // Configure JWT (required for service manager)
    let jwt_config = JwtConfig {
        secret: "seeder-secret-key".to_string(),
        issuer: "meditrack-seeder".to_string(),
        audience: "meditrack-app".to_string(),
        expiration_hours: 24,
    };

    // Initialize service manager
    println!("Initializing service manager...");
    let service_manager = Arc::new(ServiceManager::init(db_config, jwt_config).await?);

    // Create seeder
    let seeder = Seeder::new(service_manager);

    // Seed all data
    println!("Starting database seeding...");
    seeder.seed_all().await?;
    println!("Database seeding completed successfully!");

    Ok(())
}
