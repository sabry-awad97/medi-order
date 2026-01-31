use std::sync::Arc;

use db_entity::id::Id;
use db_entity::setting::dto::{
    BoolValueDto, NumberValueDto, SetMultipleSettingsDto, SetSettingDto, SettingQueryDto,
    SettingResponseDto, StringValueDto,
};
use db_entity::setting::{self, Entity as Setting};
use sea_orm::*;
use tap::{Pipe, Tap, TapFallible};

use crate::error::{ServiceError, ServiceResult};

/// Settings service for managing application settings
pub struct SettingsService {
    db: Arc<DatabaseConnection>,
}

impl SettingsService {
    /// Create a new settings service
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    // ========================================================================
    // CRUD Operations
    // ========================================================================

    /// Get a setting by ID
    pub async fn get_by_id(&self, id: Id) -> ServiceResult<SettingResponseDto> {
        let setting = Setting::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Setting not found: {}", id)))?;

        SettingResponseDto::from(setting)
            .tap(|_| tracing::debug!("Retrieved setting by ID: {}", id))
            .pipe(Ok)
    }

    /// Get a setting by key
    pub async fn get(&self, key: &str) -> ServiceResult<SettingResponseDto> {
        let setting = Setting::find()
            .filter(setting::Column::Key.eq(key))
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Setting not found: {}", key)))?;

        SettingResponseDto::from(setting)
            .tap(|_| tracing::debug!("Retrieved setting: {}", key))
            .pipe(Ok)
    }

    /// Set a setting (create or update by key)
    pub async fn set(&self, dto: SetSettingDto) -> ServiceResult<SettingResponseDto> {
        // Check if setting exists by key
        let existing = Setting::find()
            .filter(setting::Column::Key.eq(&dto.key))
            .one(&*self.db)
            .await?;

        let now = chrono::Utc::now();

        let result = if let Some(existing) = existing {
            // Update existing setting
            let mut setting: setting::ActiveModel = existing.into();
            setting.value = Set(dto.value);
            setting.category = Set(dto.category);
            setting.description = Set(dto.description);
            setting.updated_by = Set(dto.updated_by);
            setting.updated_at = Set(now.into());

            setting
                .update(&*self.db)
                .await
                .tap_ok(|_| tracing::info!("Updated setting: {}", dto.key))
                .tap_err(|e| tracing::error!("Failed to update setting {}: {}", dto.key, e))?
        } else {
            // Create new setting
            let setting = setting::ActiveModel {
                id: Set(Id::new()),
                key: Set(dto.key.clone()),
                value: Set(dto.value),
                category: Set(dto.category),
                description: Set(dto.description),
                updated_by: Set(dto.updated_by),
                created_at: Set(now.into()),
                updated_at: Set(now.into()),
            };

            setting
                .insert(&*self.db)
                .await
                .tap_ok(|_| tracing::info!("Created setting: {}", dto.key))
                .tap_err(|e| tracing::error!("Failed to create setting {}: {}", dto.key, e))?
        };

        Ok(SettingResponseDto::from(result))
    }

    /// Update a setting by ID
    pub async fn update(&self, id: Id, dto: SetSettingDto) -> ServiceResult<SettingResponseDto> {
        let setting = Setting::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Setting not found: {}", id)))?;

        // Check if new key conflicts with another setting
        if dto.key != setting.key {
            let existing = Setting::find()
                .filter(setting::Column::Key.eq(&dto.key))
                .filter(setting::Column::Id.ne(id))
                .one(&*self.db)
                .await?;

            if existing.is_some() {
                return Err(ServiceError::Conflict(format!(
                    "Setting key '{}' already exists",
                    dto.key
                )));
            }
        }

        let mut setting: setting::ActiveModel = setting.into();
        setting.key = Set(dto.key);
        setting.value = Set(dto.value);
        setting.category = Set(dto.category);
        setting.description = Set(dto.description);
        setting.updated_by = Set(dto.updated_by);
        setting.updated_at = Set(chrono::Utc::now().into());

        let result = setting
            .update(&*self.db)
            .await
            .tap_ok(|s| tracing::info!("Updated setting: {} ({})", s.key, id))
            .tap_err(|e| tracing::error!("Failed to update setting {}: {}", id, e))?;

        Ok(SettingResponseDto::from(result))
    }

    /// Delete a setting by ID
    pub async fn delete_by_id(&self, id: Id) -> ServiceResult<()> {
        let result = Setting::delete_by_id(id).exec(&*self.db).await?;

        if result.rows_affected == 0 {
            return Err(ServiceError::NotFound(format!("Setting not found: {}", id)));
        }

        tracing::info!("Deleted setting: {}", id);
        Ok(())
    }

    /// Delete a setting by key
    pub async fn delete(&self, key: &str) -> ServiceResult<()> {
        let setting = Setting::find()
            .filter(setting::Column::Key.eq(key))
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Setting not found: {}", key)))?;

        Setting::delete_by_id(setting.id).exec(&*self.db).await?;

        tracing::info!("Deleted setting: {}", key);
        Ok(())
    }

    /// List all settings with optional filtering
    pub async fn list(&self, query: SettingQueryDto) -> ServiceResult<Vec<SettingResponseDto>> {
        let mut select = Setting::find();

        // Apply filters
        if let Some(key) = query.key {
            select = select.filter(setting::Column::Key.eq(key));
        }
        if let Some(category) = query.category {
            select = select.filter(setting::Column::Category.eq(category));
        }
        if let Some(search) = query.search {
            let search_pattern = format!("%{}%", search);
            select = select.filter(
                setting::Column::Key
                    .like(&search_pattern)
                    .or(setting::Column::Description.like(&search_pattern)),
            );
        }

        let settings = select
            .order_by_asc(setting::Column::Key)
            .all(&*self.db)
            .await
            .tap_ok(|settings| tracing::debug!("Listed {} settings", settings.len()))
            .tap_err(|e| tracing::error!("Failed to list settings: {}", e))?;

        Ok(settings.into_iter().map(SettingResponseDto::from).collect())
    }

    // ========================================================================
    // Category Operations
    // ========================================================================

    /// Get all settings in a category
    pub async fn get_by_category(&self, category: &str) -> ServiceResult<Vec<SettingResponseDto>> {
        let settings = Setting::find()
            .filter(setting::Column::Category.eq(category))
            .order_by_asc(setting::Column::Key)
            .all(&*self.db)
            .await
            .tap_ok(|settings| {
                tracing::debug!(
                    "Retrieved {} settings in category '{}'",
                    settings.len(),
                    category
                )
            })
            .tap_err(|e| {
                tracing::error!("Failed to get settings by category '{}': {}", category, e)
            })?;

        Ok(settings.into_iter().map(SettingResponseDto::from).collect())
    }

    /// Get all unique categories
    pub async fn get_categories(&self) -> ServiceResult<Vec<String>> {
        let categories = Setting::find()
            .select_only()
            .column(setting::Column::Category)
            .distinct()
            .filter(setting::Column::Category.is_not_null())
            .into_tuple::<Option<String>>()
            .all(&*self.db)
            .await
            .tap_ok(|cats| tracing::debug!("Retrieved {} categories", cats.len()))
            .tap_err(|e| tracing::error!("Failed to get categories: {}", e))?;

        Ok(categories.into_iter().flatten().collect())
    }

    // ========================================================================
    // Bulk Operations
    // ========================================================================

    /// Set multiple settings at once
    pub async fn set_multiple(&self, dto: SetMultipleSettingsDto) -> ServiceResult<()> {
        for setting_dto in dto.settings {
            self.set(setting_dto).await?;
        }

        tracing::info!("Set multiple settings successfully");
        Ok(())
    }

    /// Delete all settings in a category
    pub async fn delete_category(&self, category: &str) -> ServiceResult<u64> {
        let result = Setting::delete_many()
            .filter(setting::Column::Category.eq(category))
            .exec(&*self.db)
            .await
            .tap_ok(|res| {
                tracing::info!(
                    "Deleted {} settings in category '{}'",
                    res.rows_affected,
                    category
                )
            })
            .tap_err(|e| tracing::error!("Failed to delete category '{}': {}", category, e))?;

        Ok(result.rows_affected)
    }

    // ========================================================================
    // Typed Getters (Convenience Methods)
    // ========================================================================

    /// Get setting value as string
    pub async fn get_string(&self, key: &str) -> ServiceResult<StringValueDto> {
        let setting = self.get(key).await?;

        let value = setting
            .value
            .as_str()
            .ok_or_else(|| ServiceError::BadRequest(format!("Setting '{}' is not a string", key)))?
            .to_string();

        Ok(StringValueDto { value })
    }

    /// Get setting value as boolean
    pub async fn get_bool(&self, key: &str) -> ServiceResult<BoolValueDto> {
        let setting = self.get(key).await?;

        let value = setting.value.as_bool().ok_or_else(|| {
            ServiceError::BadRequest(format!("Setting '{}' is not a boolean", key))
        })?;

        Ok(BoolValueDto { value })
    }

    /// Get setting value as number
    pub async fn get_number(&self, key: &str) -> ServiceResult<NumberValueDto> {
        let setting = self.get(key).await?;

        let value = setting.value.as_f64().ok_or_else(|| {
            ServiceError::BadRequest(format!("Setting '{}' is not a number", key))
        })?;

        Ok(NumberValueDto { value })
    }

    // ========================================================================
    // Existence Checks
    // ========================================================================

    /// Check if a setting exists by key
    pub async fn exists(&self, key: &str) -> ServiceResult<bool> {
        let count = Setting::find()
            .filter(setting::Column::Key.eq(key))
            .count(&*self.db)
            .await?;
        Ok(count > 0)
    }

    // ========================================================================
    // Statistics
    // ========================================================================

    /// Get settings statistics
    pub async fn get_statistics(&self) -> ServiceResult<SettingsStatistics> {
        let total = Setting::find().count(&*self.db).await?;

        let categories = self.get_categories().await?;
        let total_categories = categories.len() as u64;

        Ok(SettingsStatistics {
            total,
            total_categories,
        })
    }
}

/// Settings statistics
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SettingsStatistics {
    pub total: u64,
    pub total_categories: u64,
}
