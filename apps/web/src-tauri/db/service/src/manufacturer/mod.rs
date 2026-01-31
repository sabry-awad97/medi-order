use std::sync::Arc;

use db_entity::manufacturer::dto::*;
use db_entity::prelude::*;
use sea_orm::*;
use tap::TapFallible;

use crate::error::{ServiceError, ServiceResult};

/// Manufacturer service for managing pharmaceutical manufacturers
pub struct ManufacturerService {
    db: Arc<DatabaseConnection>,
}

impl ManufacturerService {
    /// Create a new manufacturer service
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    /// Create a new manufacturer
    pub async fn create(&self, data: CreateManufacturer) -> ServiceResult<ManufacturerResponse> {
        // Check if manufacturer name already exists
        if self.exists_by_name(&data.name).await? {
            return Err(ServiceError::Conflict(format!(
                "Manufacturer '{}' already exists",
                data.name
            )));
        }

        let manufacturer = db_entity::manufacturer::ActiveModel {
            id: Set(Id::new()),
            name: Set(data.name.clone()),
            short_name: Set(data.short_name),
            country: Set(data.country),
            phone: Set(data.phone),
            email: Set(data.email),
            website: Set(data.website),
            notes: Set(data.notes),
            is_active: Set(true),
            created_at: Set(chrono::Utc::now().into()),
            updated_at: Set(chrono::Utc::now().into()),
        };

        let result = manufacturer
            .insert(self.db.as_ref())
            .await
            .tap_ok(|m| tracing::info!("Created manufacturer: {} ({})", m.name, m.id))
            .tap_err(|e| tracing::error!("Failed to create manufacturer: {}", e))?;

        Ok(result.into())
    }

    /// Create multiple manufacturers in bulk (optimized for seeding/imports)
    /// Skips duplicate checks for performance - relies on database constraints
    pub async fn create_bulk(
        &self,
        data: Vec<CreateManufacturer>,
    ) -> ServiceResult<Vec<ManufacturerResponse>> {
        if data.is_empty() {
            return Ok(Vec::new());
        }

        let count = data.len();
        tracing::info!("Bulk creating {} manufacturers", count);

        // Prepare all active models
        let active_models: Vec<db_entity::manufacturer::ActiveModel> = data
            .into_iter()
            .map(|d| db_entity::manufacturer::ActiveModel {
                id: Set(Id::new()),
                name: Set(d.name),
                short_name: Set(d.short_name),
                country: Set(d.country),
                phone: Set(d.phone),
                email: Set(d.email),
                website: Set(d.website),
                notes: Set(d.notes),
                is_active: Set(true),
                created_at: Set(chrono::Utc::now().into()),
                updated_at: Set(chrono::Utc::now().into()),
            })
            .collect();

        // Use insert_many for batch insert
        Manufacturer::insert_many(active_models)
            .exec(self.db.as_ref())
            .await
            .tap_err(|e| tracing::error!("Failed to bulk create manufacturers: {}", e))?;

        tracing::info!("Successfully bulk created {} manufacturers", count);

        // Fetch the inserted records (ordered by creation time, most recent first)
        let results = Manufacturer::find()
            .order_by_desc(db_entity::manufacturer::Column::CreatedAt)
            .limit(count as u64)
            .all(self.db.as_ref())
            .await?;

        Ok(results.into_iter().map(|m| m.into()).collect())
    }

    /// Get a manufacturer by ID
    pub async fn get_by_id(&self, id: Id) -> ServiceResult<ManufacturerResponse> {
        let manufacturer = Manufacturer::find_by_id(id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Manufacturer not found: {}", id)))?;

        Ok(manufacturer.into())
    }

    /// Get a manufacturer by name
    pub async fn get_by_name(&self, name: &str) -> ServiceResult<ManufacturerResponse> {
        let manufacturer = Manufacturer::find()
            .filter(db_entity::manufacturer::Column::Name.eq(name))
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Manufacturer not found: {}", name)))?;

        Ok(manufacturer.into())
    }

    /// List all manufacturers with optional filtering
    pub async fn list(&self, active_only: bool) -> ServiceResult<Vec<ManufacturerResponse>> {
        let mut query = Manufacturer::find();

        if active_only {
            query = query.filter(db_entity::manufacturer::Column::IsActive.eq(true));
        }

        let manufacturers = query
            .order_by_asc(db_entity::manufacturer::Column::Name)
            .all(self.db.as_ref())
            .await
            .tap_ok(|m| tracing::debug!("Listed {} manufacturers", m.len()))
            .tap_err(|e| tracing::error!("Failed to list manufacturers: {}", e))?;

        Ok(manufacturers.into_iter().map(|m| m.into()).collect())
    }

    /// List active manufacturers (for dropdowns)
    pub async fn list_active(&self) -> ServiceResult<Vec<ManufacturerResponse>> {
        self.list(true).await
    }

    /// Update a manufacturer
    pub async fn update(
        &self,
        id: Id,
        data: UpdateManufacturer,
    ) -> ServiceResult<ManufacturerResponse> {
        let manufacturer = Manufacturer::find_by_id(id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Manufacturer not found: {}", id)))?;

        let mut active_model: db_entity::manufacturer::ActiveModel = manufacturer.into();

        if let Some(name) = data.name {
            // Check if new name conflicts with existing manufacturer
            if self.exists_by_name(&name).await? {
                return Err(ServiceError::Conflict(format!(
                    "Manufacturer '{}' already exists",
                    name
                )));
            }
            active_model.name = Set(name);
        }
        if let Some(short_name) = data.short_name {
            active_model.short_name = Set(Some(short_name));
        }
        if let Some(country) = data.country {
            active_model.country = Set(Some(country));
        }
        if let Some(phone) = data.phone {
            active_model.phone = Set(Some(phone));
        }
        if let Some(email) = data.email {
            active_model.email = Set(Some(email));
        }
        if let Some(website) = data.website {
            active_model.website = Set(Some(website));
        }
        if let Some(notes) = data.notes {
            active_model.notes = Set(Some(notes));
        }
        if let Some(is_active) = data.is_active {
            active_model.is_active = Set(is_active);
        }

        let result = active_model
            .update(self.db.as_ref())
            .await
            .tap_ok(|m| tracing::info!("Updated manufacturer: {} ({})", m.name, m.id))
            .tap_err(|e| tracing::error!("Failed to update manufacturer {}: {}", id, e))?;

        Ok(result.into())
    }

    /// Delete a manufacturer (soft delete by setting is_active to false)
    pub async fn delete(&self, id: Id) -> ServiceResult<()> {
        let manufacturer = Manufacturer::find_by_id(id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Manufacturer not found: {}", id)))?;

        let mut active_model: db_entity::manufacturer::ActiveModel = manufacturer.into();
        active_model.is_active = Set(false);

        active_model
            .update(self.db.as_ref())
            .await
            .tap_ok(|m| tracing::info!("Soft deleted manufacturer: {} ({})", m.name, m.id))
            .tap_err(|e| tracing::error!("Failed to delete manufacturer {}: {}", id, e))?;

        Ok(())
    }

    /// Hard delete a manufacturer (permanent deletion)
    pub async fn hard_delete(&self, id: Id) -> ServiceResult<()> {
        Manufacturer::delete_by_id(id)
            .exec(self.db.as_ref())
            .await
            .tap_ok(|_| tracing::info!("Hard deleted manufacturer: {}", id))
            .tap_err(|e| tracing::error!("Failed to hard delete manufacturer {}: {}", id, e))?;

        Ok(())
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /// Check if a manufacturer exists by ID
    pub async fn exists(&self, id: Id) -> ServiceResult<bool> {
        let count = Manufacturer::find_by_id(id).count(self.db.as_ref()).await?;
        Ok(count > 0)
    }

    /// Check if a manufacturer exists by name
    pub async fn exists_by_name(&self, name: &str) -> ServiceResult<bool> {
        let count = Manufacturer::find()
            .filter(db_entity::manufacturer::Column::Name.eq(name))
            .count(self.db.as_ref())
            .await?;
        Ok(count > 0)
    }
}

#[cfg(test)]
mod tests;
