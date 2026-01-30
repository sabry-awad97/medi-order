use crate::cli_tui::state::AppState;
use reratui::prelude::*;
use reratui::ratatui::widgets::BorderType;

#[derive(Clone)]
pub struct ExportDialog {
    pub state: AppState,
}

impl Component for ExportDialog {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Green))
            .border_type(BorderType::Rounded)
            .title(" 📤 Export Configuration ")
            .title_style(
                Style::default()
                    .fg(Color::Green)
                    .add_modifier(Modifier::BOLD),
            )
            .style(Style::default().bg(Color::Rgb(20, 25, 35)));

        let content = vec![
            Line::from(""),
            Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled(
                    "Export your configuration to a JSON file",
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
                        Style::default().fg(Color::White).bg(Color::Rgb(40, 80, 40))
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
                    "💡 Tip: ",
                    Style::default()
                        .fg(Color::Yellow)
                        .add_modifier(Modifier::BOLD),
                ),
                Span::styled(
                    "Use absolute path or relative to current directory",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
            ]),
        ];

        Paragraph::new(content).block(block).render(area, buffer);
    }
}
