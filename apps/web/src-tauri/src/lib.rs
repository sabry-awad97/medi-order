use clap::Parser;
use tauri::Manager;

mod error;
/// IPC command handlers
pub mod ipc;
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

    let builder = builder.invoke_handler(tauri::generate_handler![
        // User CRUD operations
        ipc::commands::user::create_user,
        ipc::commands::user::get_user,
        ipc::commands::user::update_user,
        ipc::commands::user::delete_user,
        ipc::commands::user::list_users,
        // Authentication & Security
        ipc::commands::user::login_user,
        ipc::commands::user::change_password,
        ipc::commands::user::reset_password,
        // User Retrieval
        ipc::commands::user::get_user_by_username,
        ipc::commands::user::get_user_by_staff_id,
        ipc::commands::user::get_user_with_staff,
        ipc::commands::user::get_active_users,
        // User Management
        ipc::commands::user::restore_user,
        ipc::commands::user::delete_user_permanently,
        // Statistics
        ipc::commands::user::get_user_statistics,
        // Onboarding & First-Run Setup
        ipc::commands::onboarding::check_first_run,
        ipc::commands::onboarding::complete_first_run_setup,
        ipc::commands::onboarding::complete_first_run_setup_default,
        // Settings CRUD operations
        ipc::commands::settings::get_setting_by_id,
        ipc::commands::settings::get_setting,
        ipc::commands::settings::set_setting,
        ipc::commands::settings::update_setting,
        ipc::commands::settings::delete_setting_by_id,
        ipc::commands::settings::delete_setting,
        ipc::commands::settings::list_settings,
        // Settings Category operations
        ipc::commands::settings::get_settings_by_category,
        ipc::commands::settings::get_setting_categories,
        ipc::commands::settings::delete_setting_category,
        // Settings Bulk operations
        ipc::commands::settings::set_multiple_settings,
        // Settings Typed getters
        ipc::commands::settings::get_setting_string,
        ipc::commands::settings::get_setting_bool,
        ipc::commands::settings::get_setting_number,
        // Settings Existence checks
        ipc::commands::settings::setting_exists,
        // Settings Statistics
        ipc::commands::settings::get_settings_statistics,
        // Inventory CRUD operations
        ipc::commands::inventory::create_inventory_item,
        ipc::commands::inventory::get_inventory_item,
        ipc::commands::inventory::get_inventory_item_by_barcode,
        ipc::commands::inventory::update_inventory_item,
        ipc::commands::inventory::delete_inventory_item,
        ipc::commands::inventory::restore_inventory_item,
        // Inventory Stock management
        ipc::commands::inventory::update_inventory_stock,
        ipc::commands::inventory::adjust_inventory_stock,
        // Inventory Listing & filtering
        ipc::commands::inventory::list_active_inventory_items,
        ipc::commands::inventory::get_low_stock_items,
        ipc::commands::inventory::get_out_of_stock_items,
        ipc::commands::inventory::search_inventory_items,
        // Inventory Statistics
        ipc::commands::inventory::get_inventory_statistics,
        // Inventory Barcode Management
        ipc::commands::inventory::get_item_barcodes,
        ipc::commands::inventory::add_barcode,
        ipc::commands::inventory::remove_barcode,
        ipc::commands::inventory::set_primary_barcode,
        ipc::commands::inventory::update_barcode,
        // Inventory Price History
        ipc::commands::inventory::get_price_history,
        ipc::commands::inventory::get_latest_price,
        ipc::commands::inventory::get_price_statistics,
        // Manufacturer CRUD operations
        ipc::commands::manufacturer::create_manufacturer,
        ipc::commands::manufacturer::create_manufacturers_bulk,
        ipc::commands::manufacturer::get_manufacturer,
        ipc::commands::manufacturer::update_manufacturer,
        ipc::commands::manufacturer::delete_manufacturer,
        // Manufacturer Retrieval
        ipc::commands::manufacturer::get_manufacturer_by_name,
        ipc::commands::manufacturer::list_manufacturers,
        ipc::commands::manufacturer::list_active_manufacturers,
        // Manufacturer Management
        ipc::commands::manufacturer::hard_delete_manufacturer,
    ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
