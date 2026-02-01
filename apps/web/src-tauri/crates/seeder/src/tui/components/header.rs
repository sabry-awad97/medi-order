use reratui::prelude::*;

#[derive(Clone)]
pub struct Header {
    pub title: String,
    pub subtitle: String,
}

impl Component for Header {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default())
            .style(Style::default());

        let content = vec![
            Line::from(vec![
                Span::styled(" MediTrack ", Style::default().add_modifier(Modifier::BOLD)),
                Span::styled("Database Seeder", Style::default()),
            ]),
            Line::from(vec![Span::styled(
                format!(" {} | {}", self.title, self.subtitle),
                Style::default(),
            )]),
        ];

        Paragraph::new(content)
            .block(block)
            .alignment(Alignment::Left)
            .render(area, buffer);
    }
}
