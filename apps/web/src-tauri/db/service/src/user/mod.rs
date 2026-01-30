use std::sync::Arc;

use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};
use db_entity::id::Id;
use db_entity::staff::Entity as Staff;
use db_entity::user::dto::{
    ChangePasswordDto, CreateUserDto, DeleteUserDto, LoginDto, LoginResponseDto, ResetPasswordDto,
    UpdateUserDto, UserQueryDto, UserResponseDto, UserWithStaffDto,
};
use db_entity::user::{self, Entity as User};
use sea_orm::*;
use tap::{Pipe, Tap, TapFallible};

use crate::jwt::JwtService;
use crate::staff::StaffService;
use crate::{
    PaginationParams, PaginationResult,
    error::{ServiceError, ServiceResult},
};

/// User service for managing user accounts and authentication
pub struct UserService {
    db: Arc<DatabaseConnection>,
    staff_service: Arc<StaffService>,
    jwt_service: Arc<JwtService>,
}

impl UserService {
    /// Create a new user service
    pub fn new(
        db: Arc<DatabaseConnection>,
        staff_service: Arc<StaffService>,
        jwt_service: Arc<JwtService>,
    ) -> Self {
        Self {
            db,
            staff_service,
            jwt_service,
        }
    }

    /// Create a new user account for a staff member
    pub async fn create(&self, dto: CreateUserDto) -> ServiceResult<UserResponseDto> {
        // Verify staff member exists using StaffService (DRY principle)
        let staff = self.staff_service.get_by_id(dto.staff_id).await?;

        // Check if staff already has a user account
        if self.staff_has_user(dto.staff_id).await? {
            return Err(ServiceError::Conflict(format!(
                "Staff member '{}' already has a user account",
                staff.employee_id
            )));
        }

        // Check if username already exists
        if self.exists_by_username(&dto.username).await? {
            return Err(ServiceError::Conflict(format!(
                "Username '{}' already exists",
                dto.username
            )));
        }

        // Check if email already exists
        if self.exists_by_email(&dto.email).await? {
            return Err(ServiceError::Conflict(format!(
                "Email '{}' already exists",
                dto.email
            )));
        }

        // Verify role exists
        if !self.role_exists(dto.role_id).await? {
            return Err(ServiceError::NotFound(format!(
                "Role not found: {}",
                dto.role_id
            )));
        }

        // Verify supervisor exists if provided
        if let Some(supervisor_id) = dto.supervisor_id
            && !self.user_exists(supervisor_id).await?
        {
            return Err(ServiceError::NotFound(format!(
                "Supervisor not found: {}",
                supervisor_id
            )));
        }

        // Hash password
        let password_hash = self.hash_password(&dto.password)?;

        let now = chrono::Utc::now();
        let user = user::ActiveModel {
            id: Set(Id::new()),
            staff_id: Set(dto.staff_id),
            username: Set(dto.username),
            email: Set(dto.email),
            password_hash: Set(password_hash),
            first_name: Set(dto.first_name),
            last_name: Set(dto.last_name),
            display_name: Set(dto.display_name),
            avatar_url: Set(dto.avatar_url),
            npi_number: Set(dto.npi_number),
            supervisor_id: Set(dto.supervisor_id),
            role_id: Set(dto.role_id),
            status: Set(dto.status),
            is_active: Set(dto.is_active),
            last_login_at: Set(None),
            created_by: Set(dto.created_by),
            updated_by: Set(dto.updated_by),
            created_at: Set(now.into()),
            updated_at: Set(now.into()),
            deleted_at: Set(None),
        };

        let result = user.insert(&*self.db).await?;

        UserResponseDto::from(result)
            .tap(|response| tracing::info!("Created user account: {}", response.username))
            .pipe(Ok)
    }

    /// Get user by ID
    pub async fn get_by_id(&self, id: Id) -> ServiceResult<UserResponseDto> {
        let user = User::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("User not found: {}", id)))?;

        Ok(UserResponseDto::from(user))
    }

    /// Get user by username
    pub async fn get_by_username(&self, username: &str) -> ServiceResult<UserResponseDto> {
        let user = User::find()
            .filter(user::Column::Username.eq(username))
            .filter(user::Column::DeletedAt.is_null())
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("User not found: {}", username)))?;

        Ok(UserResponseDto::from(user))
    }

    /// Get user by staff ID
    pub async fn get_by_staff_id(&self, staff_id: Id) -> ServiceResult<UserResponseDto> {
        let user = User::find()
            .filter(user::Column::StaffId.eq(staff_id))
            .filter(user::Column::DeletedAt.is_null())
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("User not found for staff: {}", staff_id))
            })?;

        Ok(UserResponseDto::from(user))
    }

    /// Get user with staff information
    pub async fn get_with_staff(&self, id: Id) -> ServiceResult<UserWithStaffDto> {
        let user = User::find_by_id(id)
            .find_also_related(Staff)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("User not found: {}", id)))?;

        let (user, staff) = user;
        let staff = staff.ok_or_else(|| {
            ServiceError::Internal("User has no associated staff member".to_string())
        })?;

        Ok(UserWithStaffDto {
            id: user.id,
            staff_id: user.staff_id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
            npi_number: user.npi_number,
            supervisor_id: user.supervisor_id,
            role_id: user.role_id,
            status: user.status,
            is_active: user.is_active,
            last_login_at: user.last_login_at,
            created_at: user.created_at,
            updated_at: user.updated_at,
            staff_full_name: staff.full_name,
            staff_employee_id: staff.employee_id,
            staff_position: staff.position,
            staff_department: staff.department,
            staff_email: staff.email,
            staff_phone: staff.phone,
            staff_employment_status: format!("{:?}", staff.employment_status),
        })
    }

    /// Update user
    pub async fn update(&self, id: Id, dto: UpdateUserDto) -> ServiceResult<UserResponseDto> {
        let user = User::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("User not found: {}", id)))?;

        // Check if new username conflicts
        if let Some(ref new_username) = dto.username
            && new_username != &user.username
            && self.exists_by_username(new_username).await?
        {
            return Err(ServiceError::Conflict(format!(
                "Username '{}' already exists",
                new_username
            )));
        }

        // Check if new email conflicts
        if let Some(ref new_email) = dto.email
            && new_email != &user.email
            && self.exists_by_email(new_email).await?
        {
            return Err(ServiceError::Conflict(format!(
                "Email '{}' already exists",
                new_email
            )));
        }

        // Verify new role exists if provided
        if let Some(role_id) = dto.role_id
            && !self.role_exists(role_id).await?
        {
            return Err(ServiceError::NotFound(format!(
                "Role not found: {}",
                role_id
            )));
        }

        // Verify new supervisor exists if provided
        if let Some(supervisor_id) = dto.supervisor_id
            && !self.user_exists(supervisor_id).await?
        {
            return Err(ServiceError::NotFound(format!(
                "Supervisor not found: {}",
                supervisor_id
            )));
        }

        let mut user: user::ActiveModel = user.into();

        if let Some(username) = dto.username {
            user.username = Set(username);
        }
        if let Some(email) = dto.email {
            user.email = Set(email);
        }
        if let Some(password) = dto.password {
            let password_hash = self.hash_password(&password)?;
            user.password_hash = Set(password_hash);
        }
        if let Some(first_name) = dto.first_name {
            user.first_name = Set(first_name);
        }
        if let Some(last_name) = dto.last_name {
            user.last_name = Set(last_name);
        }
        if let Some(display_name) = dto.display_name {
            user.display_name = Set(Some(display_name));
        }
        if let Some(avatar_url) = dto.avatar_url {
            user.avatar_url = Set(Some(avatar_url));
        }
        if let Some(npi_number) = dto.npi_number {
            user.npi_number = Set(Some(npi_number));
        }
        if let Some(supervisor_id) = dto.supervisor_id {
            user.supervisor_id = Set(Some(supervisor_id));
        }
        if let Some(role_id) = dto.role_id {
            user.role_id = Set(role_id);
        }
        if let Some(status) = dto.status {
            user.status = Set(status);
        }
        if let Some(is_active) = dto.is_active {
            user.is_active = Set(is_active);
        }

        user.updated_by = Set(dto.updated_by);
        user.updated_at = Set(chrono::Utc::now().into());

        let result = user.update(&*self.db).await?;

        tracing::info!("Updated user: {}", id);
        Ok(UserResponseDto::from(result))
    }

    /// Soft delete user
    pub async fn delete(&self, id: Id, dto: DeleteUserDto) -> ServiceResult<()> {
        let user = User::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("User not found: {}", id)))?;

        let mut user: user::ActiveModel = user.into();
        user.deleted_at = Set(Some(chrono::Utc::now().into()));
        user.updated_by = Set(dto.deleted_by);
        user.updated_at = Set(chrono::Utc::now().into());

        user.update(&*self.db).await?;

        tracing::info!("Soft deleted user: {}", id);
        Ok(())
    }

    /// Permanently delete user (hard delete)
    pub async fn delete_permanently(&self, id: Id) -> ServiceResult<()> {
        let result = User::delete_by_id(id).exec(&*self.db).await?;

        if result.rows_affected == 0 {
            return Err(ServiceError::NotFound(format!("User not found: {}", id)));
        }

        tracing::warn!("Permanently deleted user: {}", id);
        Ok(())
    }

    /// Restore soft-deleted user
    pub async fn restore(&self, id: Id) -> ServiceResult<UserResponseDto> {
        let user = User::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("User not found: {}", id)))?;

        if user.deleted_at.is_none() {
            return Err(ServiceError::BadRequest("User is not deleted".to_string()));
        }

        let mut user: user::ActiveModel = user.into();
        user.deleted_at = Set(None);
        user.updated_at = Set(chrono::Utc::now().into());

        let result = user.update(&*self.db).await?;

        tracing::info!("Restored user: {}", id);
        Ok(UserResponseDto::from(result))
    }

    /// List users with filtering and pagination
    pub async fn list(
        &self,
        query: UserQueryDto,
        pagination: Option<PaginationParams>,
    ) -> ServiceResult<PaginationResult<UserResponseDto>> {
        let mut select = User::find();

        // Apply filters
        if let Some(id) = query.id {
            select = select.filter(user::Column::Id.eq(id));
        }
        if let Some(staff_id) = query.staff_id {
            select = select.filter(user::Column::StaffId.eq(staff_id));
        }
        if let Some(username) = query.username {
            select = select.filter(user::Column::Username.eq(username));
        }
        if let Some(email) = query.email {
            select = select.filter(user::Column::Email.eq(email));
        }
        if let Some(role_id) = query.role_id {
            select = select.filter(user::Column::RoleId.eq(role_id));
        }
        if let Some(status) = query.status {
            select = select.filter(user::Column::Status.eq(status));
        }
        if let Some(is_active) = query.is_active {
            select = select.filter(user::Column::IsActive.eq(is_active));
        }
        if let Some(supervisor_id) = query.supervisor_id {
            select = select.filter(user::Column::SupervisorId.eq(supervisor_id));
        }

        // Handle soft-deleted records
        if !query.include_deleted.unwrap_or(false) {
            select = select.filter(user::Column::DeletedAt.is_null());
        }

        // Get total count
        let total = select.clone().count(&*self.db).await?;

        // Handle pagination
        let (response_items, page, page_size) = if let Some(pagination) = pagination {
            // Extract values before consuming
            let page = pagination.page();
            let page_size = pagination.page_size();

            // Apply pagination
            let paginator = select
                .order_by_asc(user::Column::Username)
                .paginate(&*self.db, page_size);
            let items = paginator.fetch_page(page - 1).await?;
            let response_items = items.into_iter().map(UserResponseDto::from).collect();
            (response_items, page, page_size)
        } else {
            // No pagination - return all results
            let items = select
                .order_by_asc(user::Column::Username)
                .all(&*self.db)
                .await?;
            let response_items = items.into_iter().map(UserResponseDto::from).collect();
            (response_items, 1u64, total)
        };

        Ok(PaginationResult::new(
            response_items,
            total,
            page,
            page_size,
        ))
    }

    /// Get all active users
    pub async fn get_active(&self) -> ServiceResult<Vec<UserResponseDto>> {
        let users = User::find()
            .filter(user::Column::IsActive.eq(true))
            .filter(user::Column::DeletedAt.is_null())
            .order_by_asc(user::Column::Username)
            .all(&*self.db)
            .await?;

        Ok(users.into_iter().map(UserResponseDto::from).collect())
    }

    /// Authenticate user (login)
    pub async fn login(&self, dto: LoginDto) -> ServiceResult<LoginResponseDto> {
        let user = User::find()
            .filter(user::Column::Username.eq(&dto.username))
            .filter(user::Column::DeletedAt.is_null())
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::Unauthorized("Invalid credentials".to_string()))?;

        // Verify password
        if !self.verify_password(&dto.password, &user.password_hash)? {
            return Err(ServiceError::Unauthorized(
                "Invalid credentials".to_string(),
            ));
        }

        // Check if user is active
        if !user.is_active {
            return Err(ServiceError::Unauthorized(
                "Account is inactive".to_string(),
            ));
        }

        // Update last login timestamp
        let mut user_active: user::ActiveModel = user.clone().into();
        user_active.last_login_at = Set(Some(chrono::Utc::now().into()));
        user_active.update(&*self.db).await?;

        // Get user with staff information
        let user_with_staff = self.get_with_staff(user.id).await?;

        // Generate JWT token using JwtService (reusing existing logic - DRY principle)
        let token = self
            .jwt_service
            .generate_token(
                user.id,
                user_with_staff.email.clone(),
                user_with_staff.role_id.to_string(), // TODO: Get actual role name from role service
            )
            .tap_err(|e| tracing::error!("Failed to generate JWT token: {}", e))
            .map_err(|e| ServiceError::Internal(format!("Failed to generate token: {}", e)))?;

        LoginResponseDto {
            user: user_with_staff,
            token: Some(token),
        }
        .tap(|_| tracing::info!("User logged in: {}", dto.username))
        .pipe(Ok)
    }

    /// Change user password (requires current password)
    pub async fn change_password(&self, user_id: Id, dto: ChangePasswordDto) -> ServiceResult<()> {
        let user = User::find_by_id(user_id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("User not found: {}", user_id)))?;

        // Verify current password
        if !self.verify_password(&dto.current_password, &user.password_hash)? {
            return Err(ServiceError::Unauthorized(
                "Current password is incorrect".to_string(),
            ));
        }

        // Hash new password
        let new_password_hash = self.hash_password(&dto.new_password)?;

        let mut user: user::ActiveModel = user.into();
        user.password_hash = Set(new_password_hash);
        user.updated_at = Set(chrono::Utc::now().into());

        user.update(&*self.db).await?;

        tracing::info!("User changed password: {}", user_id);
        Ok(())
    }

    /// Reset user password (admin operation, no current password required)
    pub async fn reset_password(&self, user_id: Id, dto: ResetPasswordDto) -> ServiceResult<()> {
        let user = User::find_by_id(user_id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("User not found: {}", user_id)))?;

        // Hash new password
        let new_password_hash = self.hash_password(&dto.new_password)?;

        let mut user: user::ActiveModel = user.into();
        user.password_hash = Set(new_password_hash);
        user.updated_at = Set(chrono::Utc::now().into());

        user.update(&*self.db).await?;

        tracing::warn!("Admin reset password for user: {}", user_id);
        Ok(())
    }

    /// Check if username exists
    async fn exists_by_username(&self, username: &str) -> ServiceResult<bool> {
        let count = User::find()
            .filter(user::Column::Username.eq(username))
            .filter(user::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        Ok(count > 0)
    }

    /// Check if email exists
    async fn exists_by_email(&self, email: &str) -> ServiceResult<bool> {
        let count = User::find()
            .filter(user::Column::Email.eq(email))
            .filter(user::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        Ok(count > 0)
    }

    /// Check if staff member already has a user account
    async fn staff_has_user(&self, staff_id: Id) -> ServiceResult<bool> {
        let count = User::find()
            .filter(user::Column::StaffId.eq(staff_id))
            .filter(user::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        Ok(count > 0)
    }

    /// Check if user exists
    async fn user_exists(&self, user_id: Id) -> ServiceResult<bool> {
        let count = User::find_by_id(user_id).count(&*self.db).await?;
        Ok(count > 0)
    }

    /// Check if role exists
    async fn role_exists(&self, role_id: Id) -> ServiceResult<bool> {
        let count = db_entity::role::Entity::find_by_id(role_id)
            .count(&*self.db)
            .await?;
        Ok(count > 0)
    }

    /// Hash password using Argon2
    fn hash_password(&self, password: &str) -> ServiceResult<String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| ServiceError::Internal(format!("Failed to hash password: {}", e)))?
            .to_string();

        Ok(password_hash)
    }

    /// Verify password against hash
    fn verify_password(&self, password: &str, hash: &str) -> ServiceResult<bool> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|e| ServiceError::Internal(format!("Failed to parse password hash: {}", e)))?;

        let argon2 = Argon2::default();

        Ok(argon2
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }

    /// Get user statistics
    pub async fn get_statistics(&self) -> ServiceResult<UserStatistics> {
        let total = User::find()
            .filter(user::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        let active = User::find()
            .filter(user::Column::IsActive.eq(true))
            .filter(user::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        let inactive = User::find()
            .filter(user::Column::IsActive.eq(false))
            .filter(user::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        let suspended = User::find()
            .filter(user::Column::Status.eq(db_entity::user::UserStatus::Suspended))
            .filter(user::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        Ok(UserStatistics {
            total,
            active,
            inactive,
            suspended,
        })
    }

    /// Create initial admin user for first-run setup (with default credentials)
    pub async fn create_initial_admin(&self) -> ServiceResult<UserResponseDto> {
        tracing::info!("Creating initial admin user for first-run setup");

        // Check if any users exist
        let user_count = User::find()
            .filter(user::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        if user_count > 0 {
            return Err(ServiceError::Conflict(
                "Users already exist. First-run setup already completed.".to_string(),
            ));
        }

        // Create admin role if it doesn't exist
        let admin_role_id = self.ensure_admin_role().await?;

        // Create admin staff member
        let admin_staff = self.create_admin_staff().await?;

        // Create admin user account
        let now = chrono::Utc::now();
        let password_hash = self.hash_password("admin123")?;

        let admin_user = user::ActiveModel {
            id: Set(Id::new()),
            staff_id: Set(admin_staff.id),
            username: Set("admin".to_string()),
            email: Set("admin@pharmacy.com".to_string()),
            password_hash: Set(password_hash),
            first_name: Set("System".to_string()),
            last_name: Set("Administrator".to_string()),
            display_name: Set(Some("Admin".to_string())),
            avatar_url: Set(None),
            npi_number: Set(None),
            supervisor_id: Set(None),
            role_id: Set(admin_role_id),
            status: Set(db_entity::user::UserStatus::Active),
            is_active: Set(true),
            last_login_at: Set(None),
            created_by: Set(None),
            updated_by: Set(None),
            created_at: Set(now.into()),
            updated_at: Set(now.into()),
            deleted_at: Set(None),
        };

        let result = admin_user.insert(&*self.db).await?;

        tracing::info!(
            "Initial admin user created successfully: {} ({})",
            result.username,
            result.id
        );

        Ok(UserResponseDto::from(result))
    }

    /// Create initial admin user with custom credentials for first-run setup
    pub async fn create_initial_admin_custom(
        &self,
        dto: db_entity::user::dto::FirstRunSetupDto,
    ) -> ServiceResult<UserResponseDto> {
        tracing::info!("Creating custom initial admin user for first-run setup");

        // Check if any users exist
        let user_count = User::find()
            .filter(user::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        if user_count > 0 {
            return Err(ServiceError::Conflict(
                "Users already exist. First-run setup already completed.".to_string(),
            ));
        }

        // Validate password length
        if dto.password.len() < 8 {
            return Err(ServiceError::BadRequest(
                "Password must be at least 8 characters".to_string(),
            ));
        }

        // Create admin role if it doesn't exist
        let admin_role_id = self.ensure_admin_role().await?;

        // Create admin staff member with custom info
        let admin_staff = self
            .create_admin_staff_custom(&dto.first_name, &dto.last_name, &dto.email)
            .await?;

        // Create admin user account with custom credentials
        let now = chrono::Utc::now();
        let password_hash = self.hash_password(&dto.password)?;

        let admin_user = user::ActiveModel {
            id: Set(Id::new()),
            staff_id: Set(admin_staff.id),
            username: Set(dto.username),
            email: Set(dto.email),
            password_hash: Set(password_hash),
            first_name: Set(dto.first_name),
            last_name: Set(dto.last_name),
            display_name: Set(dto.organization_name),
            avatar_url: Set(None),
            npi_number: Set(None),
            supervisor_id: Set(None),
            role_id: Set(admin_role_id),
            status: Set(db_entity::user::UserStatus::Active),
            is_active: Set(true),
            last_login_at: Set(None),
            created_by: Set(None),
            updated_by: Set(None),
            created_at: Set(now.into()),
            updated_at: Set(now.into()),
            deleted_at: Set(None),
        };

        let result = admin_user.insert(&*self.db).await?;

        tracing::info!(
            "Custom initial admin user created successfully: {} ({})",
            result.username,
            result.id
        );

        Ok(UserResponseDto::from(result))
    }

    /// Create admin staff member with custom information
    async fn create_admin_staff_custom(
        &self,
        first_name: &str,
        last_name: &str,
        email: &str,
    ) -> ServiceResult<db_entity::staff::Model> {
        use db_entity::staff::{self, EmploymentStatus, Entity as Staff, WorkSchedule};

        let full_name = format!("{} {}", first_name, last_name);

        // Check if admin staff exists
        if let Some(staff) = Staff::find()
            .filter(staff::Column::EmployeeId.eq("ADMIN001"))
            .filter(staff::Column::DeletedAt.is_null())
            .one(&*self.db)
            .await?
        {
            tracing::info!("Admin staff member already exists: {}", staff.id);
            return Ok(staff);
        }

        // Create admin staff member
        let now = chrono::Utc::now();
        let admin_staff = staff::ActiveModel {
            id: Set(Id::new()),
            full_name: Set(full_name),
            employee_id: Set("ADMIN001".to_string()),
            position: Set("System Administrator".to_string()),
            department: Set("Administration".to_string()),
            phone: Set("000-000-0000".to_string()),
            email: Set(email.to_string()),
            employment_status: Set(EmploymentStatus::Active),
            hire_date: Set(chrono::Utc::now().date_naive()),
            termination_date: Set(None),
            work_schedule: Set(WorkSchedule::FullTime),
            compensation: Set(None),
            emergency_contact_name: Set(None),
            emergency_contact_phone: Set(None),
            notes: Set(Some("Initial system administrator account".to_string())),
            created_by: Set(None),
            updated_by: Set(None),
            created_at: Set(now.into()),
            updated_at: Set(now.into()),
            deleted_at: Set(None),
        };

        let result = admin_staff.insert(&*self.db).await?;
        tracing::info!("Created custom admin staff member: {}", result.id);

        Ok(result)
    }

    /// Ensure admin role exists, create if not
    async fn ensure_admin_role(&self) -> ServiceResult<Id> {
        use db_entity::role::{self, Entity as Role};

        // Check if admin role exists
        if let Some(role) = Role::find()
            .filter(role::Column::Name.eq("admin"))
            .filter(role::Column::DeletedAt.is_null())
            .one(&*self.db)
            .await?
        {
            tracing::info!("Admin role already exists: {}", role.id);
            return Ok(role.id);
        }

        // Create admin role
        let now = chrono::Utc::now();
        let admin_role = role::ActiveModel {
            id: Set(Id::new()),
            name: Set("admin".to_string()),
            display_name: Set("Administrator".to_string()),
            description: Set(Some(
                "Full system administrator with all permissions".to_string(),
            )),
            level: Set(100),
            is_system: Set(true),
            is_active: Set(true),
            permissions: Set(serde_json::json!([
                "users:*",
                "roles:*",
                "staff:*",
                "orders:*",
                "suppliers:*",
                "reports:*",
                "settings:*"
            ])),
            created_by: Set(None),
            updated_by: Set(None),
            created_at: Set(now.into()),
            updated_at: Set(now.into()),
            deleted_at: Set(None),
        };

        let result = admin_role.insert(&*self.db).await?;
        tracing::info!("Created admin role: {}", result.id);

        Ok(result.id)
    }

    /// Create admin staff member (default)
    async fn create_admin_staff(&self) -> ServiceResult<db_entity::staff::Model> {
        use db_entity::staff::{self, EmploymentStatus, Entity as Staff, WorkSchedule};

        // Check if admin staff exists
        if let Some(staff) = Staff::find()
            .filter(staff::Column::EmployeeId.eq("ADMIN001"))
            .filter(staff::Column::DeletedAt.is_null())
            .one(&*self.db)
            .await?
        {
            tracing::info!("Admin staff member already exists: {}", staff.id);
            return Ok(staff);
        }

        // Create admin staff member
        let now = chrono::Utc::now();
        let admin_staff = staff::ActiveModel {
            id: Set(Id::new()),
            full_name: Set("System Administrator".to_string()),
            employee_id: Set("ADMIN001".to_string()),
            position: Set("System Administrator".to_string()),
            department: Set("IT".to_string()),
            phone: Set("000-000-0000".to_string()),
            email: Set("admin@pharmacy.com".to_string()),
            employment_status: Set(EmploymentStatus::Active),
            hire_date: Set(chrono::Utc::now().date_naive()),
            termination_date: Set(None),
            work_schedule: Set(WorkSchedule::FullTime),
            compensation: Set(None),
            emergency_contact_name: Set(None),
            emergency_contact_phone: Set(None),
            notes: Set(Some("Initial system administrator account".to_string())),
            created_by: Set(None),
            updated_by: Set(None),
            created_at: Set(now.into()),
            updated_at: Set(now.into()),
            deleted_at: Set(None),
        };

        let result = admin_staff.insert(&*self.db).await?;
        tracing::info!("Created admin staff member: {}", result.id);

        Ok(result)
    }
}

/// User statistics
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct UserStatistics {
    pub total: u64,
    pub active: u64,
    pub inactive: u64,
    pub suspended: u64,
}
