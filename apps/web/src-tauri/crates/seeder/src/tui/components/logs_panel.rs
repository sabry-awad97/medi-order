use crate::tui::state::{AppState, LogLevel};
use reratui::prelude::*;

#[derive(Clone)]
pub struct LogsPanel {
    pub state: AppState,
}

impl Component for LogsPanel {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default())
            .title(format!(" Logs ({}) ", self.state.logs.len()))
            .title_style(Style::default().add_modifier(Modifier::BOLD));

        let mut lines = vec![Line::from("")];

        if self.state.logs.is_empty() {
            lines.push(Line::from("  No logs yet. Start seeding to see activity."));
            lines.push(Line::from(""));
        } else {
            // Show last logs (most recent at bottom)
            let visible_logs = self.state.logs.iter().rev().take(50).rev();

            for log in visible_logs {
                let level_str = match log.level {
                    LogLevel::Info => "INFO ",
                    LogLevel::Success => "OK   ",
                    LogLevel::Error => "ERROR",
                };

                let level_style = match log.level {
                    LogLevel::Info => Style::default(),
                    LogLevel::Success => Style::default(),
                    LogLevel::Error => Style::default().add_modifier(Modifier::BOLD),
                };

                lines.push(Line::from(vec![
                    Span::styled(format!(" {} ", log.timestamp), Style::default()),
                    Span::styled(format!("[{}] ", level_str), level_style),
                    Span::styled(&log.message, Style::default()),
                ]));
            }
        }

        lines.push(Line::from(""));

        Paragraph::new(lines)
            .block(block)
            .alignment(Alignment::Left)
            .render(area, buffer);
    }
}
