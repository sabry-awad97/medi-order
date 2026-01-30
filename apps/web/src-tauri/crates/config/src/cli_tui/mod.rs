pub mod components;
pub mod handlers;
pub mod state;
pub mod utils;

pub use components::*;
pub use handlers::*;
pub use state::*;
pub use utils::*;

use dialoguer::Password;
use reratui::prelude::*;

#[derive(Clone)]
pub struct MediTrackConfigTUI {
    password: String,
}

impl Component for MediTrackConfigTUI {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let (state, set_state) =
            use_state(|| AppState::new_with_password(get_config_dir(), &self.password));

        // Handle keyboard events
        if let Some(Event::Key(key)) = use_event()
            && key.kind == KeyEventKind::Press
        {
            // Handle save shortcut
            if key.code == KeyCode::Char('s') && !state.editing {
                if matches!(state.screen, Screen::EditDatabase | Screen::EditJwt) {
                    handle_save(&state, set_state);
                }
            } else if key.code == KeyCode::Enter && state.editing {
                // Handle export/import
                match state.screen {
                    Screen::Export => handle_export(&state, set_state),
                    Screen::Import => handle_import(&state, set_state),
                    _ => handle_key_event(key.code, &state, set_state),
                }
            } else {
                handle_key_event(key.code, &state, set_state);
            }
        }

        // Create layout
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(7), // Header
                Constraint::Min(10),   // Content
                Constraint::Length(3), // Footer
            ])
            .split(area);

        // Render header component
        Header.render(chunks[0], buffer);

        // Render content based on current screen using components
        match &state.screen {
            Screen::Main => {
                MainMenu {
                    selected: state.selected_menu,
                }
                .render(chunks[1], buffer);
            }
            Screen::ViewConfig => {
                ConfigView {
                    config: state.config.clone(),
                }
                .render(chunks[1], buffer);
            }
            Screen::EditDatabase => {
                DatabaseEditor {
                    state: state.clone(),
                }
                .render(chunks[1], buffer);
            }
            Screen::EditJwt => {
                JwtEditor {
                    state: state.clone(),
                }
                .render(chunks[1], buffer);
            }
            Screen::Export => {
                ExportDialog {
                    state: state.clone(),
                }
                .render(chunks[1], buffer);
            }
            Screen::Import => {
                ImportDialog {
                    state: state.clone(),
                }
                .render(chunks[1], buffer);
            }
            Screen::Confirm(action) => {
                ConfirmDialog {
                    action: action.clone(),
                }
                .render(chunks[1], buffer);
            }
        }

        // Render footer component
        Footer {
            message: state.message.clone(),
            screen: state.screen.clone(),
        }
        .render(chunks[2], buffer);
    }
}

pub async fn run_config_tui() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    // Prompt for password
    let password = Password::new()
        .with_prompt("Enter configuration password")
        .with_confirmation("Confirm password", "Passwords do not match")
        .allow_empty_password(false)
        .interact()?;

    let tui = MediTrackConfigTUI { password };
    reratui::render(move || tui.clone()).await?;
    Ok(())
}
