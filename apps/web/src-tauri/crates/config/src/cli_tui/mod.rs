pub mod handlers;
pub mod state;
pub mod ui;
pub mod utils;

pub use handlers::*;
pub use state::*;
pub use ui::*;
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

        // Render header
        render_header(chunks[0], buffer);

        // Render content based on current screen
        match &state.screen {
            Screen::Main => render_main_menu(chunks[1], buffer, state.selected_menu),
            Screen::ViewConfig => render_view_config(chunks[1], buffer, &state.config),
            Screen::EditDatabase => render_edit_database(chunks[1], buffer, &state),
            Screen::EditJwt => render_edit_jwt(chunks[1], buffer, &state),
            Screen::Export => render_export(chunks[1], buffer, &state),
            Screen::Import => render_import(chunks[1], buffer, &state),
            Screen::Confirm(action) => render_confirm(chunks[1], buffer, action),
        }

        // Render footer with message
        render_footer(chunks[2], buffer, &state.message);
    }
}

pub async fn run_config_tui() -> anyhow::Result<()> {
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
