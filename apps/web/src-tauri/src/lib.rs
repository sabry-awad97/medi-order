use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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

            // Initialize database and services
            let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
                "postgresql://meditrack:meditrack_dev_password@localhost:5432/meditrack".to_string()
            });

            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match db_service::setup_services(&database_url).await {
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
