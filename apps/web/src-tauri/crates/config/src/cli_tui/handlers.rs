use super::state::*;
use super::utils::*;
use crate::{AppConfig, ConfigStorage};
use reratui::prelude::*;

pub fn handle_key_event(code: KeyCode, state: &AppState, set_state: StateSetter<AppState>) {
    if state.editing {
        handle_edit_mode(code, state, set_state);
    } else {
        handle_navigation_mode(code, state, set_state);
    }
}

fn handle_navigation_mode(code: KeyCode, state: &AppState, set_state: StateSetter<AppState>) {
    match code {
        KeyCode::Char('q') | KeyCode::Esc => {
            if state.screen == Screen::Main {
                request_exit();
            } else {
                let mut new_state = state.clone();
                new_state.screen = Screen::Main;
                new_state.message = None;
                set_state.set(new_state);
            }
        }
        KeyCode::Char('j') | KeyCode::Down => {
            handle_down(state, set_state);
        }
        KeyCode::Char('k') | KeyCode::Up => {
            handle_up(state, set_state);
        }
        KeyCode::Enter => {
            handle_enter(state, set_state);
        }
        KeyCode::Char('y') => {
            if matches!(state.screen, Screen::Confirm(_)) {
                handle_confirm_yes(state, set_state);
            }
        }
        KeyCode::Char('n') => {
            if matches!(state.screen, Screen::Confirm(_)) {
                let mut new_state = state.clone();
                new_state.screen = Screen::Main;
                new_state.message = Some(("Action cancelled".to_string(), MessageType::Info));
                set_state.set(new_state);
            }
        }
        _ => {}
    }
}

fn handle_edit_mode(code: KeyCode, state: &AppState, set_state: StateSetter<AppState>) {
    let mut new_state = state.clone();

    match code {
        KeyCode::Char(c) => {
            new_state.edit_buffer.push(c);
        }
        KeyCode::Backspace => {
            new_state.edit_buffer.pop();
        }
        KeyCode::Enter => {
            if apply_edit(&mut new_state) {
                new_state.editing = false;
                new_state.edit_buffer.clear();
                new_state.message = Some(("Value updated".to_string(), MessageType::Success));
            } else {
                new_state.message = Some(("Invalid value".to_string(), MessageType::Error));
            }
        }
        KeyCode::Esc => {
            new_state.editing = false;
            new_state.edit_buffer.clear();
            new_state.message = Some(("Edit cancelled".to_string(), MessageType::Info));
        }
        _ => {}
    }

    set_state.set(new_state);
}

fn handle_down(state: &AppState, set_state: StateSetter<AppState>) {
    let mut new_state = state.clone();

    match &state.screen {
        Screen::Main => {
            new_state.selected_menu = (state.selected_menu + 1).min(6);
        }
        Screen::EditDatabase => {
            new_state.edit_field = Some(match state.edit_field {
                None | Some(EditField::DbHost) => EditField::DbPort,
                Some(EditField::DbPort) => EditField::DbName,
                Some(EditField::DbName) => EditField::DbUsername,
                Some(EditField::DbUsername) => EditField::DbPassword,
                Some(EditField::DbPassword) => EditField::DbMaxConn,
                Some(EditField::DbMaxConn) => EditField::DbMinConn,
                Some(EditField::DbMinConn) => EditField::DbConnTimeout,
                Some(EditField::DbConnTimeout) => EditField::DbIdleTimeout,
                Some(EditField::DbIdleTimeout) => EditField::DbHost,
                _ => EditField::DbHost,
            });
        }
        Screen::EditJwt => {
            new_state.edit_field = Some(match state.edit_field {
                None | Some(EditField::JwtSecret) => EditField::JwtIssuer,
                Some(EditField::JwtIssuer) => EditField::JwtAudience,
                Some(EditField::JwtAudience) => EditField::JwtExpiration,
                Some(EditField::JwtExpiration) => EditField::JwtSecret,
                _ => EditField::JwtSecret,
            });
        }
        _ => {}
    }

    set_state.set(new_state);
}

fn handle_up(state: &AppState, set_state: StateSetter<AppState>) {
    let mut new_state = state.clone();

    match &state.screen {
        Screen::Main => {
            new_state.selected_menu = state.selected_menu.saturating_sub(1);
        }
        Screen::EditDatabase => {
            new_state.edit_field = Some(match state.edit_field {
                None | Some(EditField::DbHost) => EditField::DbIdleTimeout,
                Some(EditField::DbPort) => EditField::DbHost,
                Some(EditField::DbName) => EditField::DbPort,
                Some(EditField::DbUsername) => EditField::DbName,
                Some(EditField::DbPassword) => EditField::DbUsername,
                Some(EditField::DbMaxConn) => EditField::DbPassword,
                Some(EditField::DbMinConn) => EditField::DbMaxConn,
                Some(EditField::DbConnTimeout) => EditField::DbMinConn,
                Some(EditField::DbIdleTimeout) => EditField::DbConnTimeout,
                _ => EditField::DbHost,
            });
        }
        Screen::EditJwt => {
            new_state.edit_field = Some(match state.edit_field {
                None | Some(EditField::JwtSecret) => EditField::JwtExpiration,
                Some(EditField::JwtIssuer) => EditField::JwtSecret,
                Some(EditField::JwtAudience) => EditField::JwtIssuer,
                Some(EditField::JwtExpiration) => EditField::JwtAudience,
                _ => EditField::JwtSecret,
            });
        }
        _ => {}
    }

    set_state.set(new_state);
}

fn handle_enter(state: &AppState, set_state: StateSetter<AppState>) {
    let mut new_state = state.clone();

    match &state.screen {
        Screen::Main => {
            new_state.screen = match state.selected_menu {
                0 => Screen::ViewConfig,
                1 => {
                    new_state.edit_field = Some(EditField::DbHost);
                    Screen::EditDatabase
                }
                2 => {
                    new_state.edit_field = Some(EditField::JwtSecret);
                    Screen::EditJwt
                }
                3 => Screen::Confirm(ConfirmAction::Reset),
                4 => {
                    new_state.edit_field = Some(EditField::FilePath);
                    Screen::Export
                }
                5 => {
                    new_state.edit_field = Some(EditField::FilePath);
                    Screen::Import
                }
                6 => Screen::Confirm(ConfirmAction::Delete),
                _ => Screen::Main,
            };
        }
        Screen::EditDatabase | Screen::EditJwt => {
            if let Some(field) = &state.edit_field {
                new_state.editing = true;
                new_state.edit_buffer = get_current_value(&state.config, field);
            }
        }
        Screen::Export => {
            if !state.editing {
                new_state.editing = true;
                new_state.edit_buffer = "config.json".to_string();
            }
        }
        Screen::Import => {
            if !state.editing {
                new_state.editing = true;
                new_state.edit_buffer = "config.json".to_string();
            }
        }
        _ => {}
    }

    set_state.set(new_state);
}

fn get_current_value(config: &AppConfig, field: &EditField) -> String {
    match field {
        EditField::DbHost => config.database.host.clone(),
        EditField::DbPort => config.database.port.to_string(),
        EditField::DbName => config.database.database.clone(),
        EditField::DbUsername => config.database.username.clone(),
        EditField::DbPassword => config.database.password.clone(),
        EditField::DbMaxConn => config.database.max_connections.to_string(),
        EditField::DbMinConn => config.database.min_connections.to_string(),
        EditField::DbConnTimeout => config.database.connect_timeout.to_string(),
        EditField::DbIdleTimeout => config.database.idle_timeout.to_string(),
        EditField::JwtSecret => config.jwt.secret.clone(),
        EditField::JwtIssuer => config.jwt.issuer.clone(),
        EditField::JwtAudience => config.jwt.audience.clone(),
        EditField::JwtExpiration => config.jwt.expiration_hours.to_string(),
        EditField::FilePath => String::new(),
    }
}

fn apply_edit(state: &mut AppState) -> bool {
    let value = state.edit_buffer.trim();

    if let Some(field) = &state.edit_field {
        match field {
            EditField::DbHost => {
                state.config.database.host = value.to_string();
                true
            }
            EditField::DbPort => {
                if let Ok(port) = validate_port(value) {
                    state.config.database.port = port;
                    true
                } else {
                    false
                }
            }
            EditField::DbName => {
                state.config.database.database = value.to_string();
                true
            }
            EditField::DbUsername => {
                state.config.database.username = value.to_string();
                true
            }
            EditField::DbPassword => {
                state.config.database.password = value.to_string();
                true
            }
            EditField::DbMaxConn => {
                if let Ok(n) = validate_u32(value) {
                    state.config.database.max_connections = n;
                    true
                } else {
                    false
                }
            }
            EditField::DbMinConn => {
                if let Ok(n) = validate_u32(value) {
                    state.config.database.min_connections = n;
                    true
                } else {
                    false
                }
            }
            EditField::DbConnTimeout => {
                if let Ok(n) = validate_u64(value) {
                    state.config.database.connect_timeout = n;
                    true
                } else {
                    false
                }
            }
            EditField::DbIdleTimeout => {
                if let Ok(n) = validate_u64(value) {
                    state.config.database.idle_timeout = n;
                    true
                } else {
                    false
                }
            }
            EditField::JwtSecret => {
                state.config.jwt.secret = value.to_string();
                true
            }
            EditField::JwtIssuer => {
                state.config.jwt.issuer = value.to_string();
                true
            }
            EditField::JwtAudience => {
                state.config.jwt.audience = value.to_string();
                true
            }
            EditField::JwtExpiration => {
                if let Ok(n) = validate_i64(value) {
                    state.config.jwt.expiration_hours = n;
                    true
                } else {
                    false
                }
            }
            EditField::FilePath => true,
        }
    } else {
        false
    }
}

fn handle_confirm_yes(state: &AppState, set_state: StateSetter<AppState>) {
    let mut new_state = state.clone();

    match &state.screen {
        Screen::Confirm(ConfirmAction::Reset) => {
            new_state.config = AppConfig::default();
            match ConfigStorage::new_with_password(
                "meditrack",
                state.config_dir.clone(),
                &state.password,
            ) {
                Ok(storage) => match storage.save(&new_state.config) {
                    Ok(_) => {
                        new_state.message = Some((
                            "Configuration reset to defaults and saved".to_string(),
                            MessageType::Success,
                        ));
                    }
                    Err(e) => {
                        new_state.message =
                            Some((format!("Failed to save: {:?}", e), MessageType::Error));
                    }
                },
                Err(e) => {
                    new_state.message = Some((
                        format!("Failed to initialize storage: {:?}", e),
                        MessageType::Error,
                    ));
                }
            }
            new_state.screen = Screen::Main;
        }
        Screen::Confirm(ConfirmAction::Delete) => {
            match ConfigStorage::new_with_password(
                "meditrack",
                state.config_dir.clone(),
                &state.password,
            ) {
                Ok(storage) => match storage.delete() {
                    Ok(_) => {
                        new_state.message = Some((
                            "Configuration deleted successfully".to_string(),
                            MessageType::Success,
                        ));
                    }
                    Err(e) => {
                        new_state.message =
                            Some((format!("Failed to delete: {:?}", e), MessageType::Error));
                    }
                },
                Err(e) => {
                    new_state.message = Some((
                        format!("Failed to initialize storage: {:?}", e),
                        MessageType::Error,
                    ));
                }
            }
            new_state.screen = Screen::Main;
        }
        _ => {}
    }

    set_state.set(new_state);
}

pub fn handle_save(state: &AppState, set_state: StateSetter<AppState>) {
    let mut new_state = state.clone();

    match ConfigStorage::new_with_password("meditrack", state.config_dir.clone(), &state.password) {
        Ok(storage) => match storage.save(&new_state.config) {
            Ok(_) => {
                new_state.message = Some((
                    "Configuration saved successfully!".to_string(),
                    MessageType::Success,
                ));
            }
            Err(e) => {
                new_state.message = Some((format!("Failed to save: {:?}", e), MessageType::Error));
            }
        },
        Err(e) => {
            new_state.message = Some((
                format!("Failed to initialize storage: {:?}", e),
                MessageType::Error,
            ));
        }
    }

    set_state.set(new_state);
}

pub fn handle_export(state: &AppState, set_state: StateSetter<AppState>) {
    let mut new_state = state.clone();
    let path = std::path::PathBuf::from(&state.edit_buffer);

    match serde_json::to_string_pretty(&state.config) {
        Ok(json) => match std::fs::write(&path, json) {
            Ok(_) => {
                new_state.message = Some((
                    format!("Exported to: {}", path.display()),
                    MessageType::Success,
                ));
                new_state.screen = Screen::Main;
                new_state.editing = false;
                new_state.edit_buffer.clear();
            }
            Err(e) => {
                new_state.message =
                    Some((format!("Failed to write file: {}", e), MessageType::Error));
            }
        },
        Err(e) => {
            new_state.message = Some((format!("Failed to serialize: {}", e), MessageType::Error));
        }
    }

    set_state.set(new_state);
}

pub fn handle_import(state: &AppState, set_state: StateSetter<AppState>) {
    let mut new_state = state.clone();
    let path = std::path::PathBuf::from(&state.edit_buffer);

    match std::fs::read_to_string(&path) {
        Ok(json) => match serde_json::from_str::<AppConfig>(&json) {
            Ok(config) => {
                new_state.config = config;
                match ConfigStorage::new_with_password(
                    "meditrack",
                    state.config_dir.clone(),
                    &state.password,
                ) {
                    Ok(storage) => match storage.save(&new_state.config) {
                        Ok(_) => {
                            new_state.message = Some((
                                "Configuration imported and saved!".to_string(),
                                MessageType::Success,
                            ));
                            new_state.screen = Screen::Main;
                            new_state.editing = false;
                            new_state.edit_buffer.clear();
                        }
                        Err(e) => {
                            new_state.message = Some((
                                format!("Imported but failed to save: {:?}", e),
                                MessageType::Error,
                            ));
                        }
                    },
                    Err(e) => {
                        new_state.message = Some((
                            format!("Failed to initialize storage: {:?}", e),
                            MessageType::Error,
                        ));
                    }
                }
            }
            Err(e) => {
                new_state.message =
                    Some((format!("Failed to parse JSON: {}", e), MessageType::Error));
            }
        },
        Err(e) => {
            new_state.message = Some((format!("Failed to read file: {}", e), MessageType::Error));
        }
    }

    set_state.set(new_state);
}
