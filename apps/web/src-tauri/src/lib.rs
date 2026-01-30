use clap::Parser;
use tauri::Manager;

mod error;
mod state;

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
pub async fn run() {
    // Parse CLI arguments
    let cli = Cli::parse();

    // Check for --config flag BEFORE starting Tauri to prevent window creation
    if cli.config {
        // Launch config TUI directly from the library
        println!("Launching configuration TUI...");

        // Run the TUI
        match app_config::cli_tui::run_config_tui().await {
            Ok(_) => std::process::exit(0),
            Err(e) => {
                eprintln!("Failed to run configuration TUI: {}", e);
                std::process::exit(1);
            }
        }
    }

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Initialize database and services
            let app_handle = app.handle().clone();

            // Spawn state initialization asynchronously
            tauri::async_runtime::spawn(async move {
                match state::try_init_state(&app_handle).await {
                    Ok(state) => {
                        tracing::info!("Application state initialized successfully");
                        app_handle.manage(state);
                    }
                    Err(e) => {
                        tracing::error!("Failed to initialize application state: {:?}", e);
                        std::process::exit(1);
                    }
                }
            });

            Ok(())
        });

    let builder = builder.invoke_handler(tauri::generate_handler![]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
