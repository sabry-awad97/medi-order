use crate::AppConfig;
use crate::cli_tui::utils::mask_password;
use reratui::prelude::*;
use reratui::ratatui::widgets::BorderType;

#[derive(Clone)]
pub struct ConfigView {
    pub config: AppConfig,
}

impl Component for ConfigView {
    fn render(&self, area: Rect, buffer: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Rgb(100, 150, 200)))
            .border_type(BorderType::Rounded)
            .title(" 📊 Current Configuration ")
            .title_style(
                Style::default()
                    .fg(Color::Rgb(100, 150, 200))
                    .add_modifier(Modifier::BOLD),
            )
            .style(Style::default().bg(Color::Rgb(20, 25, 35)));

        let content = vec![
            Line::from(""),
            // Database section
            Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled(
                    "🗄️  DATABASE CONFIGURATION",
                    Style::default()
                        .fg(Color::Yellow)
                        .add_modifier(Modifier::BOLD),
                ),
            ]),
            Line::from(""),
            Line::from(vec![
                Span::styled(
                    "    Host:              ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(
                    &self.config.database.host,
                    Style::default().fg(Color::White),
                ),
            ]),
            Line::from(vec![
                Span::styled(
                    "    Port:              ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(
                    self.config.database.port.to_string(),
                    Style::default().fg(Color::White),
                ),
            ]),
            Line::from(vec![
                Span::styled(
                    "    Database:          ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(
                    &self.config.database.database,
                    Style::default().fg(Color::White),
                ),
            ]),
            Line::from(vec![
                Span::styled(
                    "    Username:          ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(
                    &self.config.database.username,
                    Style::default().fg(Color::White),
                ),
            ]),
            Line::from(vec![
                Span::styled(
                    "    Password:          ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(
                    mask_password(&self.config.database.password),
                    Style::default().fg(Color::Rgb(100, 100, 100)),
                ),
            ]),
            Line::from(vec![
                Span::styled(
                    "    Max Connections:   ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(
                    self.config.database.max_connections.to_string(),
                    Style::default().fg(Color::White),
                ),
            ]),
            Line::from(vec![
                Span::styled(
                    "    Min Connections:   ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(
                    self.config.database.min_connections.to_string(),
                    Style::default().fg(Color::White),
                ),
            ]),
            Line::from(vec![
                Span::styled(
                    "    Connect Timeout:   ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(
                    format!("{}s", self.config.database.connect_timeout),
                    Style::default().fg(Color::White),
                ),
            ]),
            Line::from(vec![
                Span::styled(
                    "    Idle Timeout:      ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(
                    format!("{}s", self.config.database.idle_timeout),
                    Style::default().fg(Color::White),
                ),
            ]),
            Line::from(""),
            // JWT section
            Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled(
                    "🔐 JWT CONFIGURATION",
                    Style::default()
                        .fg(Color::Cyan)
                        .add_modifier(Modifier::BOLD),
                ),
            ]),
            Line::from(""),
            Line::from(vec![
                Span::styled(
                    "    Secret:            ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(
                    mask_password(&self.config.jwt.secret),
                    Style::default().fg(Color::Rgb(100, 100, 100)),
                ),
            ]),
            Line::from(vec![
                Span::styled(
                    "    Issuer:            ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(&self.config.jwt.issuer, Style::default().fg(Color::White)),
            ]),
            Line::from(vec![
                Span::styled(
                    "    Audience:          ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(&self.config.jwt.audience, Style::default().fg(Color::White)),
            ]),
            Line::from(vec![
                Span::styled(
                    "    Expiration:        ",
                    Style::default().fg(Color::Rgb(150, 150, 150)),
                ),
                Span::styled(
                    format!("{}h", self.config.jwt.expiration_hours),
                    Style::default().fg(Color::White),
                ),
            ]),
            Line::from(""),
        ];

        Paragraph::new(content).block(block).render(area, buffer);
    }
}
