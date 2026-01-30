use crate::cli_tui::state::{AppState, EditField};
use crate::cli_tui::utils::mask_password;
use reratui::prelude::*;
use reratui::ratatui::widgets::BorderType;

#[derive(Clone)]
pub struct DatabaseEditor {
    pub state: AppState,
}

impl Component for DatabaseEditor {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Yellow))
            .border_type(BorderType::Rounded)
            .title(" 🗄️  Database Configuration ")
            .title_style(
                Style::default()
                    .fg(Color::Yellow)
                    .add_modifier(Modifier::BOLD),
            )
            .style(Style::default().bg(Color::Rgb(20, 25, 35)));

        let masked_password = mask_password(&self.state.config.database.password);
        let port_str = self.state.config.database.port.to_string();
        let max_conn_str = self.state.config.database.max_connections.to_string();
        let min_conn_str = self.state.config.database.min_connections.to_string();
        let conn_timeout_str = self.state.config.database.connect_timeout.to_string();
        let idle_timeout_str = self.state.config.database.idle_timeout.to_string();

        let fields = vec![
            (
                "Host",
                EditField::DbHost,
                self.state.config.database.host.as_str(),
            ),
            ("Port", EditField::DbPort, port_str.as_str()),
            (
                "Database",
                EditField::DbName,
                self.state.config.database.database.as_str(),
            ),
            (
                "Username",
                EditField::DbUsername,
                self.state.config.database.username.as_str(),
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
            Line::from(""),
            Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled(
                    "Configure your database connection settings",
                    Style::default()
                        .fg(Color::Rgb(150, 150, 150))
                        .add_modifier(Modifier::ITALIC),
                ),
            ]),
            Line::from(""),
        ];

        for (label, field, value) in fields {
            let is_selected = self.state.edit_field.as_ref() == Some(&field);
            let is_editing = self.state.editing && is_selected;

            let display_value = if is_editing {
                format!("{}_", self.state.edit_buffer)
            } else {
                value.to_string()
            };

            if is_selected {
                if is_editing {
                    // Editing mode - green highlight
                    content.push(Line::from(vec![
                        Span::styled(
                            "  ▶ ",
                            Style::default()
                                .fg(Color::Green)
                                .add_modifier(Modifier::BOLD),
                        ),
                        Span::styled(
                            format!("{:<22}", label),
                            Style::default()
                                .fg(Color::Green)
                                .add_modifier(Modifier::BOLD),
                        ),
                        Span::styled(
                            display_value,
                            Style::default().fg(Color::White).bg(Color::Rgb(40, 80, 40)),
                        ),
                    ]));
                } else {
                    // Selected but not editing - cyan highlight
                    content.push(Line::from(vec![
                        Span::styled(
                            "  ▶ ",
                            Style::default()
                                .fg(Color::Cyan)
                                .add_modifier(Modifier::BOLD),
                        ),
                        Span::styled(
                            format!("{:<22}", label),
                            Style::default()
                                .fg(Color::Cyan)
                                .add_modifier(Modifier::BOLD),
                        ),
                        Span::styled(display_value, Style::default().fg(Color::White)),
                    ]));
                }
            } else {
                // Normal field
                content.push(Line::from(vec![
                    Span::styled("    ", Style::default()),
                    Span::styled(
                        format!("{:<22}", label),
                        Style::default().fg(Color::Rgb(150, 150, 150)),
                    ),
                    Span::styled(
                        display_value,
                        Style::default().fg(Color::Rgb(200, 200, 200)),
                    ),
                ]));
            }
        }

        content.push(Line::from(""));

        Paragraph::new(content).block(block).render(area, buffer);
    }
}
