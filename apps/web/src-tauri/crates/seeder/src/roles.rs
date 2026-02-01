use crate::{Result, SeederError};
use db_entity::role::dto::CreateRoleDto;
use db_service::ServiceManager;
use serde::Deserialize;
use serde_json::Value as JsonValue;
use std::sync::Arc;
use tracing::info;

/// Role data structure from JSON
#[derive(Debug, Deserialize)]
struct RoleJson {
    name: String,
    display_name: String,
    description: String,
    level: i32,
    #[allow(dead_code)]
    is_system: bool,
    permissions: Vec<String>,
}

/// Load roles data from JSON file at compile time
const ROLES_JSON: &str = include_str!("../data/roles.json");

/// Parse roles from JSON
fn load_roles() -> Result<Vec<RoleJson>> {
    serde_json::from_str(ROLES_JSON)
        .map_err(|e| SeederError::DataGeneration(format!("Failed to parse roles JSON: {}", e)))
}

pub async fn seed(service_manager: &Arc<ServiceManager>) -> Result<()> {
    info!("Seeding roles...");

    // Load roles from JSON
    let roles = load_roles()?;
    info!("Loaded {} roles from JSON", roles.len());

    let mut created_count = 0;
    let mut skipped_count = 0;

    for role_data in roles.iter() {
        // Check if role already exists using the service manager's getter
        if service_manager
            .role()
            .exists_by_name(&role_data.name)
            .await
            .unwrap_or(false)
        {
            info!("Role '{}' already exists, skipping", role_data.name);
            skipped_count += 1;
            continue;
        }

        // Convert permissions Vec<String> to JSON
        let permissions_json: JsonValue =
            serde_json::to_value(&role_data.permissions).map_err(|e| {
                SeederError::DataGeneration(format!(
                    "Failed to serialize permissions for role '{}': {}",
                    role_data.name, e
                ))
            })?;

        let create_dto = CreateRoleDto {
            name: role_data.name.clone(),
            display_name: role_data.display_name.clone(),
            description: Some(role_data.description.clone()),
            level: role_data.level,
            permissions: permissions_json,
        };

        service_manager
            .role()
            .create(create_dto)
            .await
            .map_err(|e| {
                SeederError::SeedingFailed(format!(
                    "Failed to seed role '{}': {}",
                    role_data.name, e
                ))
            })?;

        created_count += 1;
    }

    info!(
        "Roles seeding completed: {} created, {} skipped",
        created_count, skipped_count
    );
    Ok(())
}
