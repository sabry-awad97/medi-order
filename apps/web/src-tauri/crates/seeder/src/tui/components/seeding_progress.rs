use crate::tui::state::AppState;
use reratui::prelude::*;

#[derive(Clone)]
pub struct SeedingProgress {
    pub state: AppState,
}

impl Component for SeedingProgress {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default())
            .title(" Seeding in Progress ")
            .title_style(Style::default().add_modifier(Modifier::BOLD))
            .style(Style::default());

        let content = vec![
            Line::from(""),
            Line::from(""),
            Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled(
                    "⏳ Seeding database...",
                    Style::default().add_modifier(Modifier::BOLD),
                ),
            ]),
            Line::from(""),
            Line::from(format!("  {}", self.state.message)),
            Line::from(""),
            Line::from("  Please wait while data is being inserted."),
            Line::from(""),
            Line::from("  This may take a few moments depending on the data size."),
            Line::from(""),
            Line::from(""),
            Line::from("  Check the logs panel for detailed progress."),
        ];

        Paragraph::new(content)
            .block(block)
            .alignment(Alignment::Left)
            .render(area, buffer);
    }
}
