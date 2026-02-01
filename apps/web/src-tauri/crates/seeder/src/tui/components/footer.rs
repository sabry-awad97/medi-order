use crate::tui::state::Screen;
use reratui::prelude::*;

#[derive(Clone)]
pub struct Footer {
    pub message: String,
    pub screen: Screen,
}

impl Component for Footer {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default())
            .style(Style::default());

        let shortcuts = match self.screen {
            Screen::Dashboard => " ↑↓ Navigate | Enter Select | R Refresh | L Logs | Q Quit ",
            Screen::Seeding => " Please wait... ",
            Screen::Complete => " R Refresh | Q Quit | Enter Back to Dashboard ",
            Screen::Logs => " R Refresh | Q Back to Dashboard | ↑↓ Scroll ",
        };

        let content = vec![Line::from(vec![
            Span::styled(shortcuts, Style::default().add_modifier(Modifier::BOLD)),
            Span::styled(" | ", Style::default()),
            Span::styled(&self.message, Style::default()),
        ])];

        Paragraph::new(content)
            .block(block)
            .alignment(Alignment::Left)
            .render(area, buffer);
    }
}
