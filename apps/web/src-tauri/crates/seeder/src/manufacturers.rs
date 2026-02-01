use crate::{Result, SeederError};
use db_entity::manufacturer::dto::CreateManufacturer;
use db_service::ServiceManager;
use std::sync::Arc;
use tracing::info;

pub const MANUFACTURERS: &[CreateManufacturer] = &[];

pub async fn seed(service_manager: &Arc<ServiceManager>) -> Result<()> {
    info!("Seeding manufacturers...");

    let manufacturer_service = service_manager.manufacturer();

    // Prepare bulk create data
    let create_dtos: Vec<CreateManufacturer> = MANUFACTURERS.to_vec();

    // Use bulk create for better performance
    match manufacturer_service.create_bulk(create_dtos).await {
        Ok(results) => {
            info!("Successfully seeded {} manufacturers", results.len());
        }
        Err(e) => {
            // If bulk fails (e.g., duplicates), try individual inserts
            info!("Bulk insert failed, trying individual inserts: {}", e);
            let mut created_count = 0;

            for mfr_data in MANUFACTURERS {
                manufacturer_service
                    .create(mfr_data.clone())
                    .await
                    .map_err(|e| {
                        SeederError::SeedingFailed(format!(
                            "Failed to seed manufacturer '{}': {}",
                            mfr_data.name, e
                        ))
                    })?;

                created_count += 1;
            }

            info!("Manufacturers seeding completed: {} created", created_count,);
        }
    }

    Ok(())
}
