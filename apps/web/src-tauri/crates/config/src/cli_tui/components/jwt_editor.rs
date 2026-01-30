use crate::cli_tui::state::{AppState, EditField};
use crate::cli_tui::utils::mask_password;
use reratui::prelude::*;
use reratui::ratatui::widgets::BorderType;

#[derive(Clone)]
pub struct JwtEditor {
    pub state: AppState,
}

impl Component for JwtEditor {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Cyan))
            .border_type(BorderType::Rounded)
            .title(" 🔐 JWT Configuration ")
            .title_style(
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            )
            .style(Style::default().bg(Color::Rgb(20, 25, 35)));

        let fields = vec![
            (
                "Secret",
                EditField::JwtSecret,
                mask_password(&self.state.config.jwt.secret),
            ),
            (
                "Issuer",
                EditField::JwtIssuer,
                self.state.config.jwt.issuer.clone(),
            ),
            (
                "Audience",
                EditField::JwtAudience,
                self.state.config.jwt.audience.clone(),
            ),
            (
                "Expiration (hours)",
                EditField::JwtExpiration,
                self.state.config.jwt.expiration_hours.to_string(),
            ),
        ];

        let mut content = vec![
            Line::from(""),
            Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled(
                    "Configure JWT authentication settings",
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
                value
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
