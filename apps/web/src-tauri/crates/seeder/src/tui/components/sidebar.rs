use crate::tui::state::Screen;
use reratui::prelude::*;

#[derive(Clone)]
pub struct Sidebar {
    pub selected: usize,
    pub current_screen: Screen,
}

impl Component for Sidebar {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default())
            .title(" Navigation ")
            .title_style(Style::default().add_modifier(Modifier::BOLD));

        let menu_items = vec![
            ("Dashboard", "Home"),
            ("Seed All", "Run all seeders"),
            ("Roles", "System roles"),
            ("Medicine Forms", "200+ forms"),
            ("Manufacturers", "Pharma companies"),
            ("Inventory", "Stock items"),
            ("Suppliers", "Supplier data"),
            ("", ""),
            ("Logs", "View logs"),
            ("Exit", "Quit app"),
        ];

        let mut lines = vec![Line::from("")];

        for (i, (title, desc)) in menu_items.iter().enumerate() {
            if title.is_empty() {
                lines.push(Line::from(""));
                continue;
            }

            let is_selected = i == self.selected;
            let prefix = if is_selected { " > " } else { "   " };

            let style = if is_selected {
                Style::default()
                    .add_modifier(Modifier::BOLD)
                    .add_modifier(Modifier::REVERSED)
            } else {
                Style::default()
            };

            lines.push(Line::from(vec![
                Span::styled(prefix, style),
                Span::styled(*title, style),
            ]));

            if !desc.is_empty() {
                lines.push(Line::from(vec![Span::styled(
                    format!("     {}", desc),
                    Style::default(),
                )]));
            }
        }

        Paragraph::new(lines)
            .block(block)
            .alignment(Alignment::Left)
            .render(area, buffer);
    }
}
