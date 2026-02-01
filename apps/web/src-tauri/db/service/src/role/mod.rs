use std::sync::Arc;

use db_entity::id::Id;
use db_entity::prelude::*;
use db_entity::role::dto::*;
use sea_orm::*;
use tap::TapFallible;

use crate::error::{ServiceError, ServiceResult};
use crate::pagination::{PaginationParams, PaginationResult};

/// Role service for managing user roles and permissions
pub struct RoleService {
    db: Arc<DatabaseConnection>,
}

impl RoleService {
    /// Create a new role service
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    // ========================================================================
    // CRUD Operations
    // ========================================================================

    /// Create a new role
    pub async fn create(&self, dto: CreateRoleDto) -> ServiceResult<RoleResponseDto> {
        // Check if role name already exists
        if self.exists_by_name(&dto.name).await? {
            return Err(ServiceError::Conflict(format!(
                "Role '{}' already exists",
                dto.name
            )));
        }

        let role = db_entity::role::ActiveModel {
            id: Set(Id::new()),
            name: Set(dto.name.clone()),
            display_name: Set(dto.display_name),
            description: Set(dto.description),
            level: Set(dto.level),
            is_system: Set(false), // User-created roles are not system roles
            is_active: Set(true),
            permissions: Set(dto.permissions),
            created_by: Set(None), // TODO: Set from context
            updated_by: Set(None),
            created_at: Set(chrono::Utc::now().into()),
            updated_at: Set(chrono::Utc::now().into()),
            deleted_at: Set(None),
        };

        let result = role
            .insert(self.db.as_ref())
            .await
            .tap_ok(|r| tracing::info!("Created role: {} ({})", r.name, r.id))
            .tap_err(|e| tracing::error!("Failed to create role: {}", e))?;

        Ok(result.into())
    }

    /// Create multiple roles in bulk (optimized for seeding/imports)
    /// Skips duplicate checks for performance - relies on database constraints
    pub async fn create_bulk(
        &self,
        data: Vec<CreateRoleDto>,
    ) -> ServiceResult<Vec<RoleResponseDto>> {
        if data.is_empty() {
            return Ok(Vec::new());
        }

        let count = data.len();
        tracing::info!("Bulk creating {} roles", count);

        // Prepare all active models
        let active_models: Vec<db_entity::role::ActiveModel> = data
            .into_iter()
            .map(|d| db_entity::role::ActiveModel {
                id: Set(Id::new()),
                name: Set(d.name),
                display_name: Set(d.display_name),
                description: Set(d.description),
                level: Set(d.level),
                is_system: Set(false),
                is_active: Set(true),
                permissions: Set(d.permissions),
                created_by: Set(None),
                updated_by: Set(None),
                created_at: Set(chrono::Utc::now().into()),
                updated_at: Set(chrono::Utc::now().into()),
                deleted_at: Set(None),
            })
            .collect();

        // Use insert_many for batch insert
        Role::insert_many(active_models)
            .exec(self.db.as_ref())
            .await
            .tap_err(|e| tracing::error!("Failed to bulk create roles: {}", e))?;

        tracing::info!("Successfully bulk created {} roles", count);

        // Fetch the inserted records (ordered by creation time, most recent first)
        let results = Role::find()
            .order_by_desc(db_entity::role::Column::CreatedAt)
            .limit(count as u64)
            .all(self.db.as_ref())
            .await?;

        Ok(results.into_iter().map(|r| r.into()).collect())
    }

    /// Get a role by ID
    pub async fn get_by_id(&self, id: Id) -> ServiceResult<RoleResponseDto> {
        let role = Role::find_by_id(id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Role not found: {}", id)))?;

        Ok(role.into())
    }

    /// Get a role by name
    pub async fn get_by_name(&self, name: &str) -> ServiceResult<RoleResponseDto> {
        let role = Role::find()
            .filter(db_entity::role::Column::Name.eq(name))
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Role not found: {}", name)))?;

        Ok(role.into())
    }

    /// List roles with filtering and pagination
    pub async fn list(
        &self,
        query: RoleQueryDto,
        pagination: Option<PaginationParams>,
    ) -> ServiceResult<PaginationResult<RoleResponseDto>> {
        let mut select = Role::find();

        // Apply filters
        if let Some(id) = query.id {
            select = select.filter(db_entity::role::Column::Id.eq(id));
        }
        if let Some(name) = query.name {
            select = select.filter(db_entity::role::Column::Name.contains(&name));
        }
        if let Some(is_active) = query.is_active {
            select = select.filter(db_entity::role::Column::IsActive.eq(is_active));
        }
        if let Some(is_system) = query.is_system {
            select = select.filter(db_entity::role::Column::IsSystem.eq(is_system));
        }
        if let Some(min_level) = query.min_level {
            select = select.filter(db_entity::role::Column::Level.gte(min_level));
        }
        if let Some(max_level) = query.max_level {
            select = select.filter(db_entity::role::Column::Level.lte(max_level));
        }

        // Filter out soft-deleted records
        select = select.filter(db_entity::role::Column::DeletedAt.is_null());

        // Get total count
        let total = select.clone().count(self.db.as_ref()).await?;

        // Handle pagination
        let (response_items, page, page_size) = if let Some(pagination) = pagination {
            let page = pagination.page();
            let page_size = pagination.page_size();

            let paginator = select
                .order_by_asc(db_entity::role::Column::Level)
                .order_by_asc(db_entity::role::Column::Name)
                .paginate(self.db.as_ref(), page_size);
            let items = paginator.fetch_page(page - 1).await?;
            let response_items = items.into_iter().map(|r| r.into()).collect();
            (response_items, page, page_size)
        } else {
            // No pagination - return all results
            let items = select
                .order_by_asc(db_entity::role::Column::Level)
                .order_by_asc(db_entity::role::Column::Name)
                .all(self.db.as_ref())
                .await?;
            let response_items = items.into_iter().map(|r| r.into()).collect();
            (response_items, 1u64, total)
        };

        Ok(PaginationResult::new(
            response_items,
            total,
            page,
            page_size,
        ))
    }

    /// Get all active roles (for dropdowns)
    pub async fn list_active(&self) -> ServiceResult<Vec<RoleResponseDto>> {
        let roles = Role::find()
            .filter(db_entity::role::Column::IsActive.eq(true))
            .filter(db_entity::role::Column::DeletedAt.is_null())
            .order_by_asc(db_entity::role::Column::Level)
            .all(self.db.as_ref())
            .await
            .tap_err(|e| tracing::error!("Failed to list active roles: {}", e))?;

        Ok(roles.into_iter().map(|r| r.into()).collect())
    }

    /// Update a role
    pub async fn update(&self, id: Id, dto: UpdateRoleDto) -> ServiceResult<RoleResponseDto> {
        let role = Role::find_by_id(id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Role not found: {}", id)))?;

        // Prevent modification of system roles
        if role.is_system {
            return Err(ServiceError::Forbidden(
                "Cannot modify system roles".to_string(),
            ));
        }

        let mut active_model: db_entity::role::ActiveModel = role.into();

        if let Some(name) = dto.name {
            // Check if new name conflicts with existing role
            if self.exists_by_name(&name).await? {
                return Err(ServiceError::Conflict(format!(
                    "Role '{}' already exists",
                    name
                )));
            }
            active_model.name = Set(name);
        }
        if let Some(display_name) = dto.display_name {
            active_model.display_name = Set(display_name);
        }
        if let Some(description) = dto.description {
            active_model.description = Set(Some(description));
        }
        if let Some(level) = dto.level {
            active_model.level = Set(level);
        }
        if let Some(is_active) = dto.is_active {
            active_model.is_active = Set(is_active);
        }
        if let Some(permissions) = dto.permissions {
            active_model.permissions = Set(permissions);
        }

        let result = active_model
            .update(self.db.as_ref())
            .await
            .tap_ok(|r| tracing::info!("Updated role: {} ({})", r.name, r.id))
            .tap_err(|e| tracing::error!("Failed to update role {}: {}", id, e))?;

        Ok(result.into())
    }

    /// Delete a role (soft delete)
    pub async fn delete(&self, id: Id) -> ServiceResult<()> {
        let role = Role::find_by_id(id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Role not found: {}", id)))?;

        // Prevent deletion of system roles
        if role.is_system {
            return Err(ServiceError::Forbidden(
                "Cannot delete system roles".to_string(),
            ));
        }

        // Check if any users are using this role
        let user_count = db_entity::user::Entity::find()
            .filter(db_entity::user::Column::RoleId.eq(id))
            .count(self.db.as_ref())
            .await?;

        if user_count > 0 {
            return Err(ServiceError::Conflict(format!(
                "Cannot delete role: {} users are using it",
                user_count
            )));
        }

        let mut active_model: db_entity::role::ActiveModel = role.into();
        active_model.deleted_at = Set(Some(chrono::Utc::now().into()));

        active_model
            .update(self.db.as_ref())
            .await
            .tap_ok(|r| tracing::info!("Soft deleted role: {} ({})", r.name, r.id))
            .tap_err(|e| tracing::error!("Failed to delete role {}: {}", id, e))?;

        Ok(())
    }

    /// Hard delete a role (permanent deletion)
    pub async fn hard_delete(&self, id: Id) -> ServiceResult<()> {
        let role = Role::find_by_id(id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Role not found: {}", id)))?;

        // Prevent deletion of system roles
        if role.is_system {
            return Err(ServiceError::Forbidden(
                "Cannot delete system roles".to_string(),
            ));
        }

        Role::delete_by_id(id)
            .exec(self.db.as_ref())
            .await
            .tap_ok(|_| tracing::info!("Hard deleted role: {}", id))
            .tap_err(|e| tracing::error!("Failed to hard delete role {}: {}", id, e))?;

        Ok(())
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /// Check if a role exists by ID
    pub async fn exists(&self, id: Id) -> ServiceResult<bool> {
        let count = Role::find_by_id(id).count(self.db.as_ref()).await?;
        Ok(count > 0)
    }

    /// Check if a role exists by name
    pub async fn exists_by_name(&self, name: &str) -> ServiceResult<bool> {
        let count = Role::find()
            .filter(db_entity::role::Column::Name.eq(name))
            .filter(db_entity::role::Column::DeletedAt.is_null())
            .count(self.db.as_ref())
            .await?;
        Ok(count > 0)
    }

    /// Get user count for a role
    pub async fn get_user_count(&self, id: Id) -> ServiceResult<u64> {
        let count = db_entity::user::Entity::find()
            .filter(db_entity::user::Column::RoleId.eq(id))
            .count(self.db.as_ref())
            .await?;
        Ok(count)
    }
}

#[cfg(test)]
mod tests;
