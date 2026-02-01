mod components;
mod state;

use components::*;
use reratui::{
    hooks::{use_mutation, use_query},
    prelude::*,
};
use state::*;
use std::sync::Arc;

use crate::Seeder;
use db_service::{DatabaseConfig, JwtConfig, ServiceManager};

#[derive(Clone)]
pub struct SeederTUI {
    service_manager: Arc<ServiceManager>,
}

impl Component for SeederTUI {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let (state, set_state) = use_state(AppState::new);

        // Create query to fetch table counts
        let service_manager_query = self.service_manager.clone();
        let counts_query = use_query(
            "table_counts",
            move || {
                let service_manager = service_manager_query.clone();
                async move {
                    let mut counts = TableCounts::default();

                    // Fetch role count
                    if let Ok(result) = service_manager
                        .role()
                        .list(db_entity::role::dto::RoleQueryDto::default(), None)
                        .await
                    {
                        counts.roles = Some(result.total());
                    }

                    // Fetch medicine forms count
                    if let Ok(result) = service_manager
                        .medicine_forms()
                        .list(
                            db_entity::medicine_form::dto::MedicineFormQueryDto::default(),
                            None,
                        )
                        .await
                    {
                        counts.medicine_forms = Some(result.total());
                    }

                    // Fetch manufacturers count
                    if let Ok(result) = service_manager
                        .manufacturer()
                        .list(
                            db_entity::manufacturer::dto::ManufacturerQueryDto::default(),
                            None,
                        )
                        .await
                    {
                        counts.manufacturers = Some(result.total());
                    }

                    Ok::<TableCounts, String>(counts)
                }
            },
            None,
        );

        // Update state with counts when query succeeds
        if let Some(counts) = &counts_query.data
            && (state.table_counts.roles != counts.roles
                || state.table_counts.medicine_forms != counts.medicine_forms
                || state.table_counts.manufacturers != counts.manufacturers)
        {
            let mut new_state = state.clone();
            new_state.table_counts = counts.clone();

            // Add log only if we're on Complete screen (after seeding)
            if matches!(state.screen, Screen::Complete) {
                new_state.add_log(
                    LogLevel::Success,
                    format!(
                        "Counts updated - Roles: {}, Forms: {}, Manufacturers: {}",
                        counts.roles.unwrap_or(0),
                        counts.medicine_forms.unwrap_or(0),
                        counts.manufacturers.unwrap_or(0)
                    ),
                );
            }

            set_state.set(new_state);
        }

        // Create mutation for seeding
        let service_manager = self.service_manager.clone();
        let mutation = use_mutation(
            move |selected_menu: usize| {
                let service_manager = service_manager.clone();
                async move {
                    let seeder = Seeder::new(service_manager);
                    match selected_menu {
                        1 => seeder.seed_all().await,
                        2 => seeder.seed_roles().await,
                        3 => seeder.seed_medicine_forms().await,
                        4 => seeder.seed_manufacturers().await,
                        5 => seeder.seed_inventory().await,
                        6 => seeder.seed_suppliers().await,
                        _ => Ok(()),
                    }
                }
            },
            None,
        );

        // Update state based on mutation status
        if mutation.is_pending() && !matches!(state.screen, Screen::Seeding) {
            let mut new_state = state.clone();
            new_state.screen = Screen::Seeding;
            new_state.message = "Seeding in progress...".to_string();

            // Determine which operation is running based on selected menu
            let operation_name = match state.selected_menu {
                1 => "Seed All",
                2 => "Roles",
                3 => "Medicine Forms",
                4 => "Manufacturers",
                5 => "Inventory",
                6 => "Suppliers",
                _ => "Unknown",
            };

            new_state.add_log(
                LogLevel::Info,
                format!("Starting {} operation", operation_name),
            );
            set_state.set(new_state);
        } else if mutation.is_success() && !matches!(state.screen, Screen::Complete) {
            let mut new_state = state.clone();
            new_state.screen = Screen::Complete;
            new_state.message = "Seeding completed successfully!".to_string();
            new_state.success = true;
            new_state.add_log(
                LogLevel::Success,
                "Seeding completed successfully".to_string(),
            );
            new_state.add_log(LogLevel::Info, "Refreshing table counts...".to_string());
            set_state.set(new_state);

            // Refetch counts after successful seeding
            counts_query.refetch();
        } else if mutation.is_error() && !matches!(state.screen, Screen::Complete) {
            let mut new_state = state.clone();
            new_state.screen = Screen::Complete;
            if let Some(err) = mutation.error() {
                new_state.message = format!("Seeding failed: {:?}", err);
                new_state.add_log(LogLevel::Error, format!("Seeding failed: {:?}", err));
            } else {
                new_state.message = "Seeding failed with unknown error".to_string();
                new_state.add_log(
                    LogLevel::Error,
                    "Seeding failed with unknown error".to_string(),
                );
            }
            new_state.success = false;
            set_state.set(new_state);
        }

        // Handle keyboard events
        if let Some(Event::Key(key)) = use_event()
            && key.kind == KeyEventKind::Press
        {
            handle_key_event(key.code, &state, set_state, &mutation, &counts_query);
        }

        // Create main layout: Header | Body | Footer
        let main_chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(4), // Header
                Constraint::Min(10),   // Body
                Constraint::Length(3), // Footer
            ])
            .split(area);

        // Render header
        let (title, subtitle) = match &state.screen {
            Screen::Dashboard => ("Dashboard", "Select an option from the sidebar"),
            Screen::Seeding => ("Seeding", "Operation in progress"),
            Screen::Complete => {
                if state.success {
                    ("Complete", "Operation successful")
                } else {
                    ("Failed", "Operation failed")
                }
            }
            Screen::Logs => ("Logs", "View seeding logs"),
        };

        Header {
            title: title.to_string(),
            subtitle: subtitle.to_string(),
        }
        .render(main_chunks[0], buffer);

        // Create body layout: Sidebar | Content
        let body_chunks = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([
                Constraint::Length(30), // Sidebar
                Constraint::Min(40),    // Content
            ])
            .split(main_chunks[1]);

        // Render sidebar
        Sidebar {
            selected: state.selected_menu,
            current_screen: state.screen.clone(),
        }
        .render(body_chunks[0], buffer);

        // Render content based on current screen
        match &state.screen {
            Screen::Dashboard => {
                Dashboard {
                    state: state.clone(),
                }
                .render(body_chunks[1], buffer);
            }
            Screen::Seeding => {
                SeedingProgress {
                    state: state.clone(),
                }
                .render(body_chunks[1], buffer);
            }
            Screen::Complete => {
                CompletionView {
                    state: state.clone(),
                }
                .render(body_chunks[1], buffer);
            }
            Screen::Logs => {
                LogsPanel {
                    state: state.clone(),
                }
                .render(body_chunks[1], buffer);
            }
        }

        // Render footer
        Footer {
            message: state.message.clone(),
            screen: state.screen.clone(),
        }
        .render(main_chunks[2], buffer);
    }
}

fn handle_key_event(
    key: KeyCode,
    state: &AppState,
    set_state: StateSetter<AppState>,
    mutation: &reratui::hooks::MutationHandle<(), crate::SeederError, usize>,
    counts_query: &reratui::hooks::QueryResult<TableCounts, String>,
) {
    match key {
        KeyCode::Up => {
            if matches!(state.screen, Screen::Dashboard | Screen::Logs) {
                let mut new_state = state.clone();
                if new_state.selected_menu > 0 {
                    new_state.selected_menu -= 1;
                    // Skip empty line (index 7)
                    if new_state.selected_menu == 7 {
                        new_state.selected_menu = 6;
                    }
                }
                set_state.set(new_state);
            }
        }
        KeyCode::Down => {
            if matches!(state.screen, Screen::Dashboard | Screen::Logs) {
                let mut new_state = state.clone();
                if new_state.selected_menu < 9 {
                    new_state.selected_menu += 1;
                    // Skip empty line (index 7)
                    if new_state.selected_menu == 7 {
                        new_state.selected_menu = 8;
                    }
                }
                set_state.set(new_state);
            }
        }
        KeyCode::Enter => {
            match state.screen {
                Screen::Dashboard => {
                    let selected = state.selected_menu;
                    match selected {
                        0 => {
                            // Dashboard - do nothing
                        }
                        1..=6 => {
                            // Seed operations - only trigger if not already seeding
                            if !mutation.is_pending() {
                                mutation.mutate(selected);
                            }
                        }
                        8 => {
                            // Logs
                            let mut new_state = state.clone();
                            new_state.screen = Screen::Logs;
                            set_state.set(new_state);
                        }
                        9 => {
                            // Exit
                            std::process::exit(0);
                        }
                        _ => {}
                    }
                }
                Screen::Complete => {
                    // Return to dashboard
                    let mut new_state = state.clone();
                    new_state.screen = Screen::Dashboard;
                    new_state.message = String::new();
                    set_state.set(new_state);
                }
                _ => {}
            }
        }
        KeyCode::Char('r') | KeyCode::Char('R') => {
            if !matches!(state.screen, Screen::Seeding) {
                let mut new_state = state.clone();
                new_state.add_log(LogLevel::Info, "Refreshing table counts...".to_string());
                set_state.set(new_state);
                counts_query.refetch();
            }
        }
        KeyCode::Char('l') | KeyCode::Char('L') => {
            if !matches!(state.screen, Screen::Seeding) {
                let mut new_state = state.clone();
                new_state.screen = Screen::Logs;
                set_state.set(new_state);
            }
        }
        KeyCode::Char('q') | KeyCode::Char('Q') | KeyCode::Esc => {
            match state.screen {
                Screen::Logs | Screen::Complete => {
                    // Return to dashboard
                    let mut new_state = state.clone();
                    new_state.screen = Screen::Dashboard;
                    new_state.message = String::new();
                    set_state.set(new_state);
                }
                Screen::Dashboard => {
                    // Exit
                    request_exit();
                }
                _ => {}
            }
        }
        _ => {}
    }
}

pub async fn run_seeder_tui() -> Result<(), Box<dyn std::error::Error>> {
    // Get config directory
    let config_dir = dirs::config_dir()
        .ok_or("Could not determine config directory")?
        .join("meditrack");

    // Check if config exists
    let config_path = config_dir.join("config.enc");
    let config_exists = config_path.exists();

    // Prompt for password
    let password = if config_exists {
        // Config exists, just ask for password
        dialoguer::Password::new()
            .with_prompt("Enter configuration password")
            .allow_empty_password(false)
            .interact()?
    } else {
        // Config doesn't exist, ask for password with confirmation
        println!("No configuration found. Creating new configuration.");
        dialoguer::Password::new()
            .with_prompt("Create configuration password")
            .with_confirmation("Confirm password", "Passwords do not match")
            .allow_empty_password(false)
            .interact()?
    };

    // Load configuration with password
    let app_config = load_config_with_password(&config_dir, &password)?;

    // Convert app_config DatabaseConfig to db_service DatabaseConfig
    let db_config = DatabaseConfig {
        url: app_config.database.connection_url(),
        max_connections: app_config.database.max_connections,
        min_connections: app_config.database.min_connections,
        connect_timeout: app_config.database.connect_timeout,
        idle_timeout: app_config.database.idle_timeout,
    };

    // Use JWT config from app_config
    let jwt_config = JwtConfig {
        secret: app_config.jwt.secret,
        issuer: app_config.jwt.issuer,
        audience: app_config.jwt.audience,
        expiration_hours: app_config.jwt.expiration_hours,
    };

    // Initialize service manager
    let service_manager = Arc::new(ServiceManager::init(db_config, jwt_config).await?);

    let tui = SeederTUI { service_manager };
    reratui::render(move || tui.clone()).await?;
    Ok(())
}

fn load_config_with_password(
    config_dir: &std::path::Path,
    password: &str,
) -> Result<app_config::AppConfig, Box<dyn std::error::Error>> {
    use app_config::ConfigStorage;

    let storage =
        ConfigStorage::new_with_password("meditrack", config_dir.to_path_buf(), password)?;

    match storage.load() {
        Ok(config) => Ok(config),
        Err(app_config::ConfigError::NotFound) => {
            let config = app_config::AppConfig::default();

            // Try to save default config for next time
            if let Err(_e) = storage.save(&config) {
                // Ignore save errors
            }

            Ok(config)
        }
        Err(app_config::ConfigError::Decryption(_)) => Err(
            "Incorrect password. Please try again or delete the config file to start fresh.".into(),
        ),
        Err(e) => Err(format!("Failed to load configuration: {:?}", e).into()),
    }
}
