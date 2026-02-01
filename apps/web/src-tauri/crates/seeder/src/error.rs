use thiserror::Error;

pub type Result<T> = std::result::Result<T, SeederError>;

#[derive(Debug, Error)]
pub enum SeederError {
    #[error("Database error: {0}")]
    Database(#[from] sea_orm::DbErr),

    #[error("Service error: {0}")]
    Service(String),

    #[error("Data generation error: {0}")]
    DataGeneration(String),

    #[error("Seeding failed: {0}")]
    SeedingFailed(String),
}
