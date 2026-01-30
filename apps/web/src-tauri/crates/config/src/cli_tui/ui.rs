use super::state::*;
use super::utils::*;
use crate::AppConfig;
use reratui::prelude::*;

pub fn render_header(area: Rect, buffer: &mut Buffer) {
    let banner = vec![
        "╔═══════════════════════════════════════════════════════════════╗",
        "║   ███╗   ███╗███████╗██████╗ ██╗████████╗██████╗  █████╗ ██╗ ║",
        "║   ████╗ ████║██╔════╝██╔══██╗██║╚══██╔══╝██╔══██╗██╔══██╗██║ ║",
        "║   ██╔████╔██║█████╗  ██║  ██║██║   ██║   ██████╔╝███████║██║ ║",
        "║   ██║╚██╔╝██║██╔══╝  ██║  ██║██║   ██║   ██╔══██╗██╔══██║╚═╝ ║",
        "║   ██║ ╚═╝ ██║███████╗██████╔╝██║   ██║   ██║  ██║██║  ██║██╗ ║",
        "╚═══════════════════════════════════════════════════════════════╝",
    ];

    let text = Text::from(
        banner
            .into_iter()
            .map(|line| Line::from(Span::styled(line, Style::default().fg(Color::Cyan))))
            .collect::<Vec<_>>(),
    );

    Paragraph::new(text)
        .alignment(Alignment::Center)
        .render(area, buffer);
}

pub fn render_main_menu(area: Rect, buffer: &mut Buffer, selected: usize) {
    let menu_items = [
        "1. 📊 View Current Configuration",
        "2. 🗄️  Edit Database Configuration",
        "3. 🔐 Edit JWT Configuration",
        "4. 🔄 Reset to Defaults",
        "5. 📤 Export Configuration",
        "6. 📥 Import Configuration",
        "7. 🗑️  Delete Configuration",
    ];

    let items: Vec<Line> = menu_items
        .iter()
        .enumerate()
        .map(|(i, item)| {
            let style = if i == selected {
                Style::default()
                    .fg(Color::Black)
                    .bg(Color::Cyan)
                    .add_modifier(Modifier::BOLD)
            } else {
                Style::default().fg(Color::White)
            };
            Line::from(Span::styled(format!("  {}  ", item), style))
        })
        .collect();

    let block = Block::default()
        .title(" Main Menu ")
        .title_style(
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Cyan));

    Paragraph::new(Text::from(items))
        .block(block)
        .alignment(Alignment::Left)
        .render(area, buffer);
}

pub fn render_view_config(area: Rect, buffer: &mut Buffer, config: &AppConfig) {
    let content = vec![
        Line::from(Span::styled(
            "📊 DATABASE CONFIGURATION",
            Style::default()
                .fg(Color::Yellow)
                .add_modifier(Modifier::BOLD),
        )),
        Line::from(""),
        Line::from(format!("  Host:              {}", config.database.host)),
        Line::from(format!("  Port:              {}", config.database.port)),
        Line::from(format!("  Database:          {}", config.database.database)),
        Line::from(format!("  Username:          {}", config.database.username)),
        Line::from(format!(
            "  Password:          {}",
            mask_password(&config.database.password)
        )),
        Line::from(format!(
            "  Max Connections:   {}",
            config.database.max_connections
        )),
        Line::from(format!(
            "  Min Connections:   {}",
            config.database.min_connections
        )),
        Line::from(format!(
            "  Connect Timeout:   {}s",
            config.database.connect_timeout
        )),
        Line::from(format!(
            "  Idle Timeout:      {}s",
            config.database.idle_timeout
        )),
        Line::from(""),
        Line::from(Span::styled(
            "🔐 JWT CONFIGURATION",
            Style::default()
                .fg(Color::Yellow)
                .add_modifier(Modifier::BOLD),
        )),
        Line::from(""),
        Line::from(format!(
            "  Secret:            {}",
            mask_password(&config.jwt.secret)
        )),
        Line::from(format!("  Issuer:            {}", config.jwt.issuer)),
        Line::from(format!("  Audience:          {}", config.jwt.audience)),
        Line::from(format!(
            "  Expiration:        {}h",
            config.jwt.expiration_hours
        )),
    ];

    let block = Block::default()
        .title(" Current Configuration ")
        .title_style(
            Style::default()
                .fg(Color::Green)
                .add_modifier(Modifier::BOLD),
        )
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Green));

    Paragraph::new(Text::from(content))
        .block(block)
        .render(area, buffer);
}

pub fn render_edit_database(area: Rect, buffer: &mut Buffer, state: &AppState) {
    let masked_password = mask_password(&state.config.database.password);
    let port_str = state.config.database.port.to_string();
    let max_conn_str = state.config.database.max_connections.to_string();
    let min_conn_str = state.config.database.min_connections.to_string();
    let conn_timeout_str = state.config.database.connect_timeout.to_string();
    let idle_timeout_str = state.config.database.idle_timeout.to_string();

    let fields = vec![
        (
            "Host",
            EditField::DbHost,
            state.config.database.host.as_str(),
        ),
        ("Port", EditField::DbPort, port_str.as_str()),
        (
            "Database",
            EditField::DbName,
            state.config.database.database.as_str(),
        ),
        (
            "Username",
            EditField::DbUsername,
            state.config.database.username.as_str(),
        ),
        ("Password", EditField::DbPassword, masked_password.as_str()),
        (
            "Max Connections",
            EditField::DbMaxConn,
            max_conn_str.as_str(),
        ),
        (
            "Min Connections",
            EditField::DbMinConn,
            min_conn_str.as_str(),
        ),
        (
            "Connect Timeout (s)",
            EditField::DbConnTimeout,
            conn_timeout_str.as_str(),
        ),
        (
            "Idle Timeout (s)",
            EditField::DbIdleTimeout,
            idle_timeout_str.as_str(),
        ),
    ];

    let mut content = vec![
        Line::from(Span::styled(
            "🗄️  Edit Database Configuration",
            Style::default()
                .fg(Color::Yellow)
                .add_modifier(Modifier::BOLD),
        )),
        Line::from(""),
        Line::from("Use ↑↓ or j/k to navigate, Enter to edit, ESC to cancel"),
        Line::from("Press 's' to save changes"),
        Line::from(""),
    ];

    for (label, field, value) in fields {
        let is_selected = state.edit_field.as_ref() == Some(&field);
        let is_editing = state.editing && is_selected;

        let display_value = if is_editing {
            format!("{}_", state.edit_buffer)
        } else {
            value.to_string()
        };

        let style = if is_selected {
            if is_editing {
                Style::default()
                    .fg(Color::Green)
                    .add_modifier(Modifier::BOLD)
            } else {
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD)
            }
        } else {
            Style::default().fg(Color::White)
        };

        let prefix = if is_selected { "▶ " } else { "  " };
        content.push(Line::from(Span::styled(
            format!("{}{:<20} {}", prefix, label, display_value),
            style,
        )));
    }

    let block = Block::default()
        .title(" Edit Database ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Yellow));

    Paragraph::new(Text::from(content))
        .block(block)
        .render(area, buffer);
}

pub fn render_edit_jwt(area: Rect, buffer: &mut Buffer, state: &AppState) {
    let fields = vec![
        (
            "Secret",
            EditField::JwtSecret,
            mask_password(&state.config.jwt.secret),
        ),
        (
            "Issuer",
            EditField::JwtIssuer,
            state.config.jwt.issuer.clone(),
        ),
        (
            "Audience",
            EditField::JwtAudience,
            state.config.jwt.audience.clone(),
        ),
        (
            "Expiration (hours)",
            EditField::JwtExpiration,
            state.config.jwt.expiration_hours.to_string(),
        ),
    ];

    let mut content = vec![
        Line::from(Span::styled(
            "🔐 Edit JWT Configuration",
            Style::default()
                .fg(Color::Yellow)
                .add_modifier(Modifier::BOLD),
        )),
        Line::from(""),
        Line::from("Use ↑↓ or j/k to navigate, Enter to edit, ESC to cancel"),
        Line::from("Press 's' to save changes"),
        Line::from(""),
    ];

    for (label, field, value) in fields {
        let is_selected = state.edit_field.as_ref() == Some(&field);
        let is_editing = state.editing && is_selected;

        let display_value = if is_editing {
            format!("{}_", state.edit_buffer)
        } else {
            value
        };

        let style = if is_selected {
            if is_editing {
                Style::default()
                    .fg(Color::Green)
                    .add_modifier(Modifier::BOLD)
            } else {
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD)
            }
        } else {
            Style::default().fg(Color::White)
        };

        let prefix = if is_selected { "▶ " } else { "  " };
        content.push(Line::from(Span::styled(
            format!("{}{:<20} {}", prefix, label, display_value),
            style,
        )));
    }

    let block = Block::default()
        .title(" Edit JWT ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Yellow));

    Paragraph::new(Text::from(content))
        .block(block)
        .render(area, buffer);
}

pub fn render_export(area: Rect, buffer: &mut Buffer, state: &AppState) {
    let content = vec![
        Line::from(Span::styled(
            "📤 Export Configuration",
            Style::default()
                .fg(Color::Green)
                .add_modifier(Modifier::BOLD),
        )),
        Line::from(""),
        Line::from("Enter the file path to export configuration as JSON:"),
        Line::from(""),
        Line::from(Span::styled(
            if state.editing {
                format!("Path: {}_", state.edit_buffer)
            } else {
                "Press Enter to start typing...".to_string()
            },
            if state.editing {
                Style::default()
                    .fg(Color::Green)
                    .add_modifier(Modifier::BOLD)
            } else {
                Style::default().fg(Color::DarkGray)
            },
        )),
        Line::from(""),
        Line::from("Press Enter to export, ESC to cancel"),
    ];

    let block = Block::default()
        .title(" Export ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Green));

    Paragraph::new(Text::from(content))
        .block(block)
        .render(area, buffer);
}

pub fn render_import(area: Rect, buffer: &mut Buffer, state: &AppState) {
    let content = vec![
        Line::from(Span::styled(
            "📥 Import Configuration",
            Style::default()
                .fg(Color::Blue)
                .add_modifier(Modifier::BOLD),
        )),
        Line::from(""),
        Line::from("Enter the file path to import configuration from JSON:"),
        Line::from(""),
        Line::from(Span::styled(
            if state.editing {
                format!("Path: {}_", state.edit_buffer)
            } else {
                "Press Enter to start typing...".to_string()
            },
            if state.editing {
                Style::default()
                    .fg(Color::Green)
                    .add_modifier(Modifier::BOLD)
            } else {
                Style::default().fg(Color::DarkGray)
            },
        )),
        Line::from(""),
        Line::from("Press Enter to import, ESC to cancel"),
    ];

    let block = Block::default()
        .title(" Import ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Blue));

    Paragraph::new(Text::from(content))
        .block(block)
        .render(area, buffer);
}

pub fn render_confirm(area: Rect, buffer: &mut Buffer, action: &ConfirmAction) {
    let (title, message, color) = match action {
        ConfirmAction::Reset => (
            " Confirm Reset ",
            "Are you sure you want to reset all configuration to defaults?",
            Color::Yellow,
        ),
        ConfirmAction::Delete => (
            " Confirm Delete ",
            "Are you sure you want to delete the configuration file?",
            Color::Red,
        ),
    };

    let content = vec![
        Line::from(""),
        Line::from(Span::styled(
            message,
            Style::default().fg(color).add_modifier(Modifier::BOLD),
        )),
        Line::from(""),
        Line::from(""),
        Line::from(Span::styled(
            "Press 'y' to confirm, 'n' or ESC to cancel",
            Style::default().fg(Color::White),
        )),
    ];

    let block = Block::default()
        .title(title)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(color));

    Paragraph::new(Text::from(content))
        .block(block)
        .alignment(Alignment::Center)
        .render(area, buffer);
}

pub fn render_footer(area: Rect, buffer: &mut Buffer, message: &Option<(String, MessageType)>) {
    let text = if let Some((msg, msg_type)) = message {
        let color = match msg_type {
            MessageType::Success => Color::Green,
            MessageType::Error => Color::Red,
            MessageType::Info => Color::Cyan,
        };
        Line::from(Span::styled(msg.clone(), Style::default().fg(color)))
    } else {
        Line::from(Span::styled(
            "Press 'q' to quit | ↑↓ or j/k to navigate | Enter to select/edit | 's' to save",
            Style::default().fg(Color::DarkGray),
        ))
    };

    let block = Block::default()
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    Paragraph::new(text)
        .block(block)
        .alignment(Alignment::Center)
        .render(area, buffer);
}
