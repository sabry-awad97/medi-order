use crate::tui::state::AppState;
use reratui::prelude::*;

#[derive(Clone)]
pub struct CompletionView {
    pub state: AppState,
}

impl Component for CompletionView {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default())
            .title(if self.state.success {
                " Seeding Complete "
            } else {
                " Seeding Failed "
            })
            .title_style(Style::default().add_modifier(Modifier::BOLD))
            .style(Style::default());

        let mut content = vec![Line::from(""), Line::from("")];

        if self.state.success {
            content.push(Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled("✓ ", Style::default().add_modifier(Modifier::BOLD)),
                Span::styled("Success!", Style::default().add_modifier(Modifier::BOLD)),
            ]));
            content.push(Line::from(""));
            content.push(Line::from("  Database seeding completed successfully."));
            content.push(Line::from(""));
            content.push(Line::from(
                "  All data has been inserted into the database.",
            ));
        } else {
            content.push(Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled("✗ ", Style::default().add_modifier(Modifier::BOLD)),
                Span::styled("Failed!", Style::default().add_modifier(Modifier::BOLD)),
            ]));
            content.push(Line::from(""));
            content.push(Line::from(format!("  {}", self.state.message)));
            content.push(Line::from(""));
            content.push(Line::from("  Check the logs for more details."));
        }

        content.push(Line::from(""));
        content.push(Line::from(""));
        content.push(Line::from("  Press Enter to return to dashboard"));
        content.push(Line::from("  Press L to view logs"));
        content.push(Line::from("  Press Q to exit"));

        Paragraph::new(content)
            .block(block)
            .alignment(Alignment::Left)
            .render(area, buffer);
    }
}
