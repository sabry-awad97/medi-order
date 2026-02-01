/// Example: Selective seeding
///
/// Run with: cargo run --example seed_selective -- --medicine-forms --manufacturers
use app_seeder::Seeder;
use db_service::{DatabaseConfig, JwtConfig, ServiceManager};
use std::env;
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    let args: Vec<String> = env::args().collect();

    // Parse command line arguments
    let seed_all = args.contains(&"--all".to_string());
    let seed_roles = args.contains(&"--roles".to_string());
    let seed_medicine_forms = args.contains(&"--medicine-forms".to_string());
    let seed_manufacturers = args.contains(&"--manufacturers".to_string());
    let seed_inventory = args.contains(&"--inventory".to_string());
    let seed_suppliers = args.contains(&"--suppliers".to_string());

    if !seed_all
        && !seed_roles
        && !seed_medicine_forms
        && !seed_manufacturers
        && !seed_inventory
        && !seed_suppliers
    {
        println!("Usage: seed_selective [OPTIONS]");
        println!("\nOptions:");
        println!("  --all                Seed all data");
        println!("  --roles              Seed roles only");
        println!("  --medicine-forms     Seed medicine forms only");
        println!("  --manufacturers      Seed manufacturers only");
        println!("  --inventory          Seed inventory items only");
        println!("  --suppliers          Seed suppliers only");
        println!(
            "\nExample: cargo run --example seed_selective -- --roles --medicine-forms --manufacturers"
        );
        return Ok(());
    }

    // Get database URL from environment or use default
    let database_url =
        env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite://meditrack.db?mode=rwc".to_string());

    println!("Connecting to database: {}", database_url);

    // Configure database
    let db_config = DatabaseConfig {
        url: database_url,
        max_connections: 10,
        min_connections: 2,
        connect_timeout: 30,
        idle_timeout: 600,
    };

    // Configure JWT
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

    // Seed based on arguments
    if seed_all {
        println!("Seeding all data...");
        seeder.seed_all().await?;
    } else {
        if seed_roles {
            println!("Seeding roles...");
            seeder.seed_roles().await?;
        }
        if seed_medicine_forms {
            println!("Seeding medicine forms...");
            seeder.seed_medicine_forms().await?;
        }
        if seed_manufacturers {
            println!("Seeding manufacturers...");
            seeder.seed_manufacturers().await?;
        }
        if seed_inventory {
            println!("Seeding inventory...");
            seeder.seed_inventory().await?;
        }
        if seed_suppliers {
            println!("Seeding suppliers...");
            seeder.seed_suppliers().await?;
        }
    }

    println!("Seeding completed successfully!");
    Ok(())
}
