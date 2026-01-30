use reratui::prelude::*;
use reratui::ratatui::widgets::BorderType;

#[derive(Clone)]
pub struct Header;

impl Component for Header {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        // Modern gradient-style header
        let title_block = Block::default()
            .borders(Borders::ALL)
            .border_style(
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            )
            .border_type(BorderType::Rounded)
            .style(Style::default().bg(Color::Rgb(20, 25, 35)));

        // App title with icon
        let title = vec![
            Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled(
                    "⚕",
                    Style::default()
                        .fg(Color::Cyan)
                        .add_modifier(Modifier::BOLD),
                ),
                Span::styled(
                    "  MediTrack ",
                    Style::default()
                        .fg(Color::White)
                        .add_modifier(Modifier::BOLD),
                ),
                Span::styled(
                    "Configuration Manager",
                    Style::default().fg(Color::Rgb(100, 150, 200)),
                ),
            ]),
            Line::from(""),
            Line::from(vec![
                Span::styled("     ", Style::default()),
                Span::styled(
                    "Secure Configuration Management System",
                    Style::default()
                        .fg(Color::Rgb(150, 150, 150))
                        .add_modifier(Modifier::ITALIC),
                ),
            ]),
        ];

        Paragraph::new(title)
            .block(title_block)
            .alignment(Alignment::Center)
            .render(area, buffer);
    }
}
