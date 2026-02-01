#[derive(Clone, Debug, PartialEq)]
pub enum Screen {
    Dashboard,
    Seeding,
    Complete,
    Logs,
}

#[derive(Clone)]
pub struct AppState {
    pub screen: Screen,
    pub selected_menu: usize,
    pub message: String,
    pub success: bool,
    pub logs: Vec<LogEntry>,
    pub show_logs: bool,
    pub table_counts: TableCounts,
}

#[derive(Clone, Debug, Default)]
pub struct TableCounts {
    pub roles: Option<u64>,
    pub medicine_forms: Option<u64>,
    pub manufacturers: Option<u64>,
    pub inventory: Option<u64>,
    pub suppliers: Option<u64>,
}

#[derive(Clone, Debug)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: LogLevel,
    pub message: String,
}

#[derive(Clone, Debug, PartialEq)]
pub enum LogLevel {
    Info,
    Success,
    Error,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            screen: Screen::Dashboard,
            selected_menu: 0,
            message: String::new(),
            success: false,
            logs: Vec::new(),
            show_logs: false,
            table_counts: TableCounts::default(),
        }
    }

    pub fn add_log(&mut self, level: LogLevel, message: String) {
        let timestamp = chrono::Local::now().format("%H:%M:%S").to_string();
        self.logs.push(LogEntry {
            timestamp,
            level,
            message,
        });

        // Keep only last 100 logs
        if self.logs.len() > 100 {
            self.logs.remove(0);
        }
    }
}
