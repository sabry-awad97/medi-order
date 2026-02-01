use crate::tui::state::AppState;
use reratui::prelude::*;

#[derive(Clone)]
pub struct Dashboard {
    pub state: AppState,
}

impl Component for Dashboard {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        // Split into two columns
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([Constraint::Percentage(50), Constraint::Percentage(50)])
            .split(area);

        // Top section - Welcome
        let welcome_block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default())
            .title(" Welcome ")
            .title_style(Style::default().add_modifier(Modifier::BOLD));

        let welcome_content = vec![
            Line::from(""),
            Line::from(vec![Span::styled(
                "  Database Seeding Tool",
                Style::default().add_modifier(Modifier::BOLD),
            )]),
            Line::from(""),
            Line::from("  Populate your MediTrack database with initial data."),
            Line::from(""),
            Line::from("  Use the sidebar to select what data to seed:"),
            Line::from(""),
            Line::from("  • Seed All - Run all seeders in order"),
            Line::from("  • Individual Seeders - Run specific data types"),
            Line::from("  • Logs - View seeding logs and progress"),
            Line::from(""),
        ];

        Paragraph::new(welcome_content)
            .block(welcome_block)
            .alignment(Alignment::Left)
            .render(chunks[0], buffer);

        // Bottom section - Status with counts
        let status_block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default())
            .title(" Database Status ")
            .title_style(Style::default().add_modifier(Modifier::BOLD));

        let format_count = |count: Option<u64>| -> String {
            match count {
                Some(n) => format!("{}", n),
                None => "...".to_string(),
            }
        };

        let status_content = vec![
            Line::from(""),
            Line::from(vec![
                Span::styled(
                    "  Database: ",
                    Style::default().add_modifier(Modifier::BOLD),
                ),
                Span::styled("Connected", Style::default()),
            ]),
            Line::from(""),
            Line::from(vec![Span::styled(
                "  Table Counts:",
                Style::default().add_modifier(Modifier::BOLD),
            )]),
            Line::from(""),
            Line::from(vec![
                Span::styled("    Roles: ", Style::default()),
                Span::styled(
                    format_count(self.state.table_counts.roles),
                    Style::default(),
                ),
            ]),
            Line::from(vec![
                Span::styled("    Medicine Forms: ", Style::default()),
                Span::styled(
                    format_count(self.state.table_counts.medicine_forms),
                    Style::default(),
                ),
            ]),
            Line::from(vec![
                Span::styled("    Manufacturers: ", Style::default()),
                Span::styled(
                    format_count(self.state.table_counts.manufacturers),
                    Style::default(),
                ),
            ]),
            Line::from(""),
            Line::from(vec![
                Span::styled(
                    "  Total Logs: ",
                    Style::default().add_modifier(Modifier::BOLD),
                ),
                Span::styled(format!("{}", self.state.logs.len()), Style::default()),
            ]),
            Line::from(""),
        ];

        Paragraph::new(status_content)
            .block(status_block)
            .alignment(Alignment::Left)
            .render(chunks[1], buffer);
    }
}
