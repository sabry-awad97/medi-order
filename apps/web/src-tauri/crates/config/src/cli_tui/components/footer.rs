use crate::cli_tui::state::{MessageType, Screen};
use reratui::prelude::*;
use reratui::ratatui::widgets::BorderType;

#[derive(Clone)]
pub struct Footer {
    pub message: Option<(String, MessageType)>,
    pub screen: Screen,
}

impl Component for Footer {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Rgb(60, 70, 90)))
            .border_type(BorderType::Rounded)
            .style(Style::default().bg(Color::Rgb(20, 25, 35)));

        let content = if let Some((msg, msg_type)) = &self.message {
            let (icon, color) = match msg_type {
                MessageType::Success => ("✓", Color::Green),
                MessageType::Error => ("✗", Color::Red),
                MessageType::Info => ("ℹ", Color::Cyan),
            };

            Line::from(vec![
                Span::styled(
                    format!(" {} ", icon),
                    Style::default().fg(color).add_modifier(Modifier::BOLD),
                ),
                Span::styled(msg.clone(), Style::default().fg(color)),
            ])
        } else {
            // Context-aware help text
            let help_text = match self.screen {
                Screen::Main => "↑↓ Navigate  │  Enter Select  │  Q Quit",
                Screen::EditDatabase | Screen::EditJwt => {
                    "↑↓ Navigate  │  Enter Edit  │  S Save  │  Esc Back"
                }
                Screen::Export | Screen::Import => "Enter Confirm  │  Esc Cancel",
                Screen::Confirm(_) => "Y Confirm  │  N Cancel",
                _ => "Esc Back  │  Q Quit",
            };

            Line::from(vec![
                Span::styled(
                    " ⌨  ",
                    Style::default()
                        .fg(Color::Cyan)
                        .add_modifier(Modifier::BOLD),
                ),
                Span::styled(help_text, Style::default().fg(Color::Rgb(150, 150, 150))),
            ])
        };

        Paragraph::new(content)
            .block(block)
            .alignment(Alignment::Center)
            .render(area, buffer);
    }
}
