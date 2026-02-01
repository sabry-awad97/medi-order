use crate::{Result, SeederError};
use db_entity::manufacturer::dto::CreateManufacturer;
use db_service::ServiceManager;
use std::sync::Arc;

pub const MANUFACTURERS: &[CreateManufacturer] = &[];

pub async fn seed(service_manager: &Arc<ServiceManager>) -> Result<()> {
    let manufacturer_service = service_manager.manufacturer();

    // Prepare bulk create data
    let create_dtos: Vec<CreateManufacturer> = MANUFACTURERS.to_vec();

    // Use bulk create for better performance
    match manufacturer_service.create_bulk(create_dtos).await {
        Ok(_results) => {
            // Successfully seeded
        }
        Err(_e) => {
            // If bulk fails (e.g., duplicates), try individual inserts
            let mut _created_count = 0;

            for mfr_data in MANUFACTURERS.iter() {
                manufacturer_service
                    .create(mfr_data.clone())
                    .await
                    .map_err(|e| {
                        SeederError::SeedingFailed(format!(
                            "Failed to seed manufacturer '{}': {}",
                            mfr_data.name, e
                        ))
                    })?;
            }
        }
    }

    Ok(())
}
