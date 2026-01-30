use crate::cli_tui::state::ConfirmAction;
use reratui::{prelude::*, ratatui::widgets::BorderType};

#[derive(Clone)]
pub struct ConfirmDialog {
    pub action: ConfirmAction,
}

impl Component for ConfirmDialog {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let (title, icon, message, warning, color) = match &self.action {
            ConfirmAction::Reset => (
                " Confirm Reset ",
                "🔄",
                "Reset Configuration to Defaults",
                "All your current settings will be lost and replaced with default values.",
                Color::Yellow,
            ),
            ConfirmAction::Delete => (
                " Confirm Delete ",
                "🗑️",
                "Delete Configuration File",
                "The configuration file will be permanently deleted from your system.",
                Color::Red,
            ),
        };

        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(color))
            .border_type(BorderType::Rounded)
            .title(title)
            .title_style(Style::default().fg(color).add_modifier(Modifier::BOLD))
            .style(Style::default().bg(Color::Rgb(20, 25, 35)));

        let content = vec![
            Line::from(""),
            Line::from(""),
            Line::from(vec![
                Span::styled(
                    format!("  {}  ", icon),
                    Style::default().fg(color).add_modifier(Modifier::BOLD),
                ),
                Span::styled(
                    message,
                    Style::default()
                        .fg(Color::White)
                        .add_modifier(Modifier::BOLD),
                ),
            ]),
            Line::from(""),
            Line::from(vec![
                Span::styled("     ", Style::default()),
                Span::styled(warning, Style::default().fg(Color::Rgb(150, 150, 150))),
            ]),
            Line::from(""),
            Line::from(""),
            Line::from(vec![
                Span::styled("     ", Style::default()),
                Span::styled(
                    "Are you sure you want to continue?",
                    Style::default().fg(color).add_modifier(Modifier::BOLD),
                ),
            ]),
            Line::from(""),
            Line::from(""),
            Line::from(vec![
                Span::styled("     ", Style::default()),
                Span::styled("Press ", Style::default().fg(Color::Rgb(150, 150, 150))),
                Span::styled(
                    "Y",
                    Style::default()
                        .fg(Color::Green)
                        .add_modifier(Modifier::BOLD),
                ),
                Span::styled(
                    " to confirm  │  ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(
                    "N",
                    Style::default().fg(Color::Red).add_modifier(Modifier::BOLD),
                ),
                Span::styled(" or ", Style::default().fg(Color::Rgb(150, 150, 150))),
                Span::styled(
                    "Esc",
                    Style::default().fg(Color::Red).add_modifier(Modifier::BOLD),
                ),
                Span::styled(" to cancel", Style::default().fg(Color::Rgb(150, 150, 150))),
            ]),
        ];

        Paragraph::new(content)
            .block(block)
            .alignment(Alignment::Left)
            .render(area, buffer);
    }
}
