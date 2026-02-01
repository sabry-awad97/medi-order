use thiserror::Error;

pub type Result<T> = std::result::Result<T, SeederError>;

#[derive(Debug, Error, Clone)]
pub enum SeederError {
    #[error("Database error: {0}")]
    Database(String),

    #[error("Service error: {0}")]
    Service(String),

    #[error("Data generation error: {0}")]
    DataGeneration(String),

    #[error("Seeding failed: {0}")]
    SeedingFailed(String),
}

impl From<sea_orm::DbErr> for SeederError {
    fn from(err: sea_orm::DbErr) -> Self {
        SeederError::Database(err.to_string())
    }
}
