use crate::cli_tui::state::AppState;
use reratui::prelude::*;
use reratui::ratatui::widgets::BorderType;

#[derive(Clone)]
pub struct ImportDialog {
    pub state: AppState,
}

impl Component for ImportDialog {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Blue))
            .border_type(BorderType::Rounded)
            .title(" 📥 Import Configuration ")
            .title_style(
                Style::default()
                    .fg(Color::Blue)
                    .add_modifier(Modifier::BOLD),
            )
            .style(Style::default().bg(Color::Rgb(20, 25, 35)));

        let content = vec![
            Line::from(""),
            Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled(
                    "Import configuration from a JSON file",
                    Style::default()
                        .fg(Color::Rgb(150, 150, 150))
                        .add_modifier(Modifier::ITALIC),
                ),
            ]),
            Line::from(""),
            Line::from(vec![Span::styled(
                "  File Path: ",
                Style::default().fg(Color::Rgb(150, 150, 150)),
            )]),
            Line::from(""),
            Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled(
                    if self.state.editing && !self.state.edit_buffer.is_empty() {
                        format!("  {}_", self.state.edit_buffer)
                    } else if self.state.editing {
                        "  _".to_string()
                    } else {
                        "  (press Enter to start typing...)".to_string()
                    },
                    if self.state.editing {
                        Style::default().fg(Color::White).bg(Color::Rgb(40, 60, 80))
                    } else {
                        Style::default().fg(Color::Rgb(100, 100, 100))
                    },
                ),
            ]),
            Line::from(""),
            Line::from(""),
            Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled(
                    "⚠️  Warning: ",
                    Style::default()
                        .fg(Color::Yellow)
                        .add_modifier(Modifier::BOLD),
                ),
                Span::styled(
                    "This will overwrite your current configuration",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
            ]),
        ];

        Paragraph::new(content).block(block).render(area, buffer);
    }
}
