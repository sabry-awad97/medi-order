mod error;
mod inventory;
mod manufacturers;
mod medicine_forms;
mod roles;
mod suppliers;
mod tui;

use db_service::ServiceManager;
use error::{Result, SeederError};
use std::sync::Arc;

/// Main seeder orchestrator
pub struct Seeder {
    service_manager: Arc<ServiceManager>,
}

impl Seeder {
    pub fn new(service_manager: Arc<ServiceManager>) -> Self {
        Self { service_manager }
    }

    /// Run all seeders in the correct order
    pub async fn seed_all(&self) -> Result<()> {
        // Seed in dependency order
        self.seed_roles().await?;
        self.seed_medicine_forms().await?;
        self.seed_manufacturers().await?;
        self.seed_inventory().await?;
        self.seed_suppliers().await?;

        Ok(())
    }

    /// Seed roles
    pub async fn seed_roles(&self) -> Result<()> {
        roles::seed(&self.service_manager).await
    }

    /// Seed medicine forms
    pub async fn seed_medicine_forms(&self) -> Result<()> {
        medicine_forms::seed(&self.service_manager).await
    }

    /// Seed manufacturers
    pub async fn seed_manufacturers(&self) -> Result<()> {
        manufacturers::seed(&self.service_manager).await
    }

    /// Seed inventory items
    pub async fn seed_inventory(&self) -> Result<()> {
        inventory::seed(&self.service_manager).await
    }

    /// Seed suppliers
    pub async fn seed_suppliers(&self) -> Result<()> {
        suppliers::seed(&self.service_manager).await
    }
}

#[tokio::main]
async fn main() -> std::result::Result<(), Box<dyn std::error::Error>> {
    tui::run_seeder_tui().await
}
