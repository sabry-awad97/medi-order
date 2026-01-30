use clap::Parser;
use tauri::Manager;

/// MediTrack - Pharmacy Management System
#[derive(Parser, Debug)]
#[command(name = "meditrack")]
#[command(about = "MediTrack - Pharmacy Management System", long_about = None)]
struct Cli {
    /// Launch the configuration TUI
    #[arg(short, long)]
    config: bool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Parse CLI arguments
    let cli = Cli::parse();

    // Check for --config flag BEFORE starting Tauri to prevent window creation
    if cli.config {
        // Launch config TUI directly from the library
        println!("Launching configuration TUI...");

        // Run the TUI in a blocking manner
        let runtime = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime");
        match runtime.block_on(app_config::cli_tui::run_config_tui()) {
            Ok(_) => std::process::exit(0),
            Err(e) => {
                eprintln!("Failed to run configuration TUI: {}", e);
                std::process::exit(1);
            }
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Get app config directory
            let config_dir = app
                .path()
                .app_config_dir()
                .expect("Failed to get app config directory");

            // Load application configuration from storage or use defaults
            let config = app_config::AppConfig::load_or_default(config_dir);

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

            // Initialize database and services
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match db_service::ServiceManager::init(db_config, jwt_config).await {
                    Ok(service_manager) => {
                        log::info!("Database services initialized successfully");
                        app_handle.manage(service_manager);
                    }
                    Err(e) => {
                        log::error!("Failed to initialize database services: {:?}", e);
                        log::warn!("Application will continue without database services");
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
