use reratui::prelude::*;
use reratui::ratatui::widgets::BorderType;

#[derive(Clone)]
pub struct MainMenu {
    pub selected: usize,
}

impl Component for MainMenu {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Cyan))
            .border_type(BorderType::Rounded)
            .title(" 📋 Main Menu ")
            .title_style(
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            )
            .style(Style::default().bg(Color::Rgb(20, 25, 35)));

        // Menu items with icons and descriptions
        let menu_items = [
            ("📊", "View Configuration", "Display current settings"),
            ("🗄️", "Database Settings", "Configure database connection"),
            ("🔐", "JWT Settings", "Manage authentication tokens"),
            ("🔄", "Reset to Defaults", "Restore default configuration"),
            ("📤", "Export Config", "Save configuration to file"),
            ("📥", "Import Config", "Load configuration from file"),
            ("🗑️", "Delete Config", "Remove configuration file"),
        ];

        let mut lines = vec![Line::from("")];

        for (i, (icon, title, desc)) in menu_items.iter().enumerate() {
            let is_selected = i == self.selected;

            if is_selected {
                // Selected item with highlight
                lines.push(Line::from(vec![
                    Span::styled(
                        "  ▶ ",
                        Style::default()
                            .fg(Color::Cyan)
                            .add_modifier(Modifier::BOLD),
                    ),
                    Span::styled(
                        format!("{} ", icon),
                        Style::default()
                            .fg(Color::Yellow)
                            .add_modifier(Modifier::BOLD),
                    ),
                    Span::styled(
                        *title,
                        Style::default()
                            .fg(Color::White)
                            .add_modifier(Modifier::BOLD),
                    ),
                ]));
                lines.push(Line::from(vec![
                    Span::styled("      ", Style::default()),
                    Span::styled(
                        *desc,
                        Style::default()
                            .fg(Color::Rgb(150, 150, 150))
                            .add_modifier(Modifier::ITALIC),
                    ),
                ]));
            } else {
                // Normal item
                lines.push(Line::from(vec![
                    Span::styled("    ", Style::default()),
                    Span::styled(
                        format!("{} ", icon),
                        Style::default().fg(Color::Rgb(100, 150, 200)),
                    ),
                    Span::styled(*title, Style::default().fg(Color::Rgb(200, 200, 200))),
                ]));
                lines.push(Line::from(vec![
                    Span::styled("      ", Style::default()),
                    Span::styled(*desc, Style::default().fg(Color::Rgb(100, 100, 100))),
                ]));
            }

            lines.push(Line::from(""));
        }

        Paragraph::new(lines).block(block).render(area, buffer);
    }
}
