use std::sync::Arc;

use db_entity::id::Id;
use db_entity::staff::dto::{
    CreateStaffDto, DeleteStaffDto, StaffListDto, StaffQueryDto, StaffResponseDto,
    TerminateStaffDto, UpdateStaffDto,
};
use db_entity::staff::{self, Entity as Staff};
use db_entity::user::{self, Entity as User};
use sea_orm::*;

use crate::error::{ServiceError, ServiceResult};

/// Staff service for managing staff members
#[derive(Clone)]
pub struct StaffService {
    db: Arc<DatabaseConnection>,
}

impl StaffService {
    /// Create a new staff service
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    /// Create a new staff member
    pub async fn create(&self, dto: CreateStaffDto) -> ServiceResult<StaffResponseDto> {
        // Check if employee_id already exists
        if self.exists_by_employee_id(&dto.employee_id).await? {
            return Err(ServiceError::Conflict(format!(
                "Employee ID '{}' already exists",
                dto.employee_id
            )));
        }

        // Check if email already exists
        if self.exists_by_email(&dto.email).await? {
            return Err(ServiceError::Conflict(format!(
                "Email '{}' already exists",
                dto.email
            )));
        }

        let now = chrono::Utc::now();
        let staff = staff::ActiveModel {
            id: Set(Id::new()),
            full_name: Set(dto.full_name),
            employee_id: Set(dto.employee_id),
            position: Set(dto.position),
            department: Set(dto.department),
            phone: Set(dto.phone),
            email: Set(dto.email),
            employment_status: Set(dto.employment_status),
            hire_date: Set(dto.hire_date),
            termination_date: Set(dto.termination_date),
            work_schedule: Set(dto.work_schedule),
            compensation: Set(dto.compensation),
            emergency_contact_name: Set(dto.emergency_contact_name),
            emergency_contact_phone: Set(dto.emergency_contact_phone),
            notes: Set(dto.notes),
            created_by: Set(dto.created_by),
            updated_by: Set(dto.updated_by),
            created_at: Set(now.into()),
            updated_at: Set(now.into()),
            deleted_at: Set(None),
        };

        let result = staff.insert(&*self.db).await?;
        let mut response = StaffResponseDto::from(result);
        response.has_user_account = false;

        tracing::info!("Created staff member: {}", response.employee_id);
        Ok(response)
    }

    /// Get staff member by ID
    pub async fn get_by_id(&self, id: Id) -> ServiceResult<StaffResponseDto> {
        let staff = Staff::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Staff member not found: {}", id)))?;

        let has_user_account = self.has_user_account(id).await?;
        let mut response = StaffResponseDto::from(staff);
        response.has_user_account = has_user_account;

        Ok(response)
    }

    /// Get staff member by employee ID
    pub async fn get_by_employee_id(&self, employee_id: &str) -> ServiceResult<StaffResponseDto> {
        let staff = Staff::find()
            .filter(staff::Column::EmployeeId.eq(employee_id))
            .filter(staff::Column::DeletedAt.is_null())
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Staff member not found: {}", employee_id))
            })?;

        let has_user_account = self.has_user_account(staff.id).await?;
        let mut response = StaffResponseDto::from(staff);
        response.has_user_account = has_user_account;

        Ok(response)
    }

    /// Update staff member
    pub async fn update(&self, id: Id, dto: UpdateStaffDto) -> ServiceResult<StaffResponseDto> {
        let staff = Staff::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Staff member not found: {}", id)))?;

        // Check if new employee_id conflicts
        if let Some(ref new_employee_id) = dto.employee_id
            && new_employee_id != &staff.employee_id
            && self.exists_by_employee_id(new_employee_id).await?
        {
            return Err(ServiceError::Conflict(format!(
                "Employee ID '{}' already exists",
                new_employee_id
            )));
        }

        // Check if new email conflicts
        if let Some(ref new_email) = dto.email
            && new_email != &staff.email
            && self.exists_by_email(new_email).await?
        {
            return Err(ServiceError::Conflict(format!(
                "Email '{}' already exists",
                new_email
            )));
        }

        let mut staff: staff::ActiveModel = staff.into();

        if let Some(full_name) = dto.full_name {
            staff.full_name = Set(full_name);
        }
        if let Some(employee_id) = dto.employee_id {
            staff.employee_id = Set(employee_id);
        }
        if let Some(position) = dto.position {
            staff.position = Set(position);
        }
        if let Some(department) = dto.department {
            staff.department = Set(department);
        }
        if let Some(phone) = dto.phone {
            staff.phone = Set(phone);
        }
        if let Some(email) = dto.email {
            staff.email = Set(email);
        }
        if let Some(employment_status) = dto.employment_status {
            staff.employment_status = Set(employment_status);
        }
        if let Some(hire_date) = dto.hire_date {
            staff.hire_date = Set(hire_date);
        }
        if let Some(termination_date) = dto.termination_date {
            staff.termination_date = Set(Some(termination_date));
        }
        if let Some(work_schedule) = dto.work_schedule {
            staff.work_schedule = Set(work_schedule);
        }
        if let Some(compensation) = dto.compensation {
            staff.compensation = Set(Some(compensation));
        }
        if let Some(emergency_contact_name) = dto.emergency_contact_name {
            staff.emergency_contact_name = Set(Some(emergency_contact_name));
        }
        if let Some(emergency_contact_phone) = dto.emergency_contact_phone {
            staff.emergency_contact_phone = Set(Some(emergency_contact_phone));
        }
        if let Some(notes) = dto.notes {
            staff.notes = Set(Some(notes));
        }

        staff.updated_by = Set(dto.updated_by);
        staff.updated_at = Set(chrono::Utc::now().into());

        let result = staff.update(&*self.db).await?;
        let has_user_account = self.has_user_account(id).await?;
        let mut response = StaffResponseDto::from(result);
        response.has_user_account = has_user_account;

        tracing::info!("Updated staff member: {}", id);
        Ok(response)
    }

    /// Soft delete staff member
    pub async fn delete(&self, id: Id, dto: DeleteStaffDto) -> ServiceResult<()> {
        let staff = Staff::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Staff member not found: {}", id)))?;

        let mut staff: staff::ActiveModel = staff.into();
        staff.deleted_at = Set(Some(chrono::Utc::now().into()));
        staff.updated_by = Set(dto.deleted_by);
        staff.updated_at = Set(chrono::Utc::now().into());

        staff.update(&*self.db).await?;

        tracing::info!("Soft deleted staff member: {}", id);
        Ok(())
    }

    /// Permanently delete staff member (hard delete)
    pub async fn delete_permanently(&self, id: Id) -> ServiceResult<()> {
        let result = Staff::delete_by_id(id).exec(&*self.db).await?;

        if result.rows_affected == 0 {
            return Err(ServiceError::NotFound(format!(
                "Staff member not found: {}",
                id
            )));
        }

        tracing::warn!("Permanently deleted staff member: {}", id);
        Ok(())
    }

    /// Restore soft-deleted staff member
    pub async fn restore(&self, id: Id) -> ServiceResult<StaffResponseDto> {
        let staff = Staff::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Staff member not found: {}", id)))?;

        if staff.deleted_at.is_none() {
            return Err(ServiceError::BadRequest(
                "Staff member is not deleted".to_string(),
            ));
        }

        let mut staff: staff::ActiveModel = staff.into();
        staff.deleted_at = Set(None);
        staff.updated_at = Set(chrono::Utc::now().into());

        let result = staff.update(&*self.db).await?;
        let has_user_account = self.has_user_account(id).await?;
        let mut response = StaffResponseDto::from(result);
        response.has_user_account = has_user_account;

        tracing::info!("Restored staff member: {}", id);
        Ok(response)
    }

    /// Terminate staff member
    pub async fn terminate(
        &self,
        id: Id,
        dto: TerminateStaffDto,
    ) -> ServiceResult<StaffResponseDto> {
        let staff = Staff::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Staff member not found: {}", id)))?;

        let mut staff: staff::ActiveModel = staff.into();
        staff.employment_status = Set(db_entity::staff::EmploymentStatus::Terminated);
        staff.termination_date = Set(Some(dto.termination_date));
        if let Some(notes) = dto.notes {
            staff.notes = Set(Some(notes));
        }
        staff.updated_by = Set(dto.updated_by);
        staff.updated_at = Set(chrono::Utc::now().into());

        let result = staff.update(&*self.db).await?;
        let has_user_account = self.has_user_account(id).await?;
        let mut response = StaffResponseDto::from(result);
        response.has_user_account = has_user_account;

        tracing::info!("Terminated staff member: {}", id);
        Ok(response)
    }

    /// List staff members with filtering and pagination
    pub async fn list(
        &self,
        query: StaffQueryDto,
        page: u64,
        page_size: u64,
    ) -> ServiceResult<StaffListDto> {
        let mut select = Staff::find();

        // Apply filters
        if let Some(id) = query.id {
            select = select.filter(staff::Column::Id.eq(id));
        }
        if let Some(employee_id) = query.employee_id {
            select = select.filter(staff::Column::EmployeeId.eq(employee_id));
        }
        if let Some(employment_status) = query.employment_status {
            select = select.filter(staff::Column::EmploymentStatus.eq(employment_status));
        }
        if let Some(department) = query.department {
            select = select.filter(staff::Column::Department.eq(department));
        }
        if let Some(position) = query.position {
            select = select.filter(staff::Column::Position.eq(position));
        }
        if let Some(search) = query.search {
            let search_pattern = format!("%{}%", search);
            select = select.filter(
                staff::Column::FullName
                    .like(&search_pattern)
                    .or(staff::Column::Email.like(&search_pattern))
                    .or(staff::Column::EmployeeId.like(&search_pattern)),
            );
        }

        // Handle soft-deleted records
        if !query.include_deleted.unwrap_or(false) {
            select = select.filter(staff::Column::DeletedAt.is_null());
        }

        // Get total count
        let total = select.clone().count(&*self.db).await?;

        // Apply pagination
        let paginator = select
            .order_by_asc(staff::Column::FullName)
            .paginate(&*self.db, page_size);

        let items = paginator.fetch_page(page - 1).await?;

        // Convert to response DTOs and check for user accounts
        let mut response_items = Vec::new();
        for item in items {
            let has_user_account = self.has_user_account(item.id).await?;
            let mut response = StaffResponseDto::from(item);
            response.has_user_account = has_user_account;
            response_items.push(response);
        }

        Ok(StaffListDto {
            items: response_items,
            total,
            page,
            page_size,
        })
    }

    /// Get all active staff members
    pub async fn get_active(&self) -> ServiceResult<Vec<StaffResponseDto>> {
        let staff_list = Staff::find()
            .filter(staff::Column::EmploymentStatus.eq(db_entity::staff::EmploymentStatus::Active))
            .filter(staff::Column::DeletedAt.is_null())
            .order_by_asc(staff::Column::FullName)
            .all(&*self.db)
            .await?;

        let mut response_items = Vec::new();
        for item in staff_list {
            let has_user_account = self.has_user_account(item.id).await?;
            let mut response = StaffResponseDto::from(item);
            response.has_user_account = has_user_account;
            response_items.push(response);
        }

        Ok(response_items)
    }

    /// Get staff members by department
    pub async fn get_by_department(
        &self,
        department: &str,
    ) -> ServiceResult<Vec<StaffResponseDto>> {
        let staff_list = Staff::find()
            .filter(staff::Column::Department.eq(department))
            .filter(staff::Column::DeletedAt.is_null())
            .order_by_asc(staff::Column::FullName)
            .all(&*self.db)
            .await?;

        let mut response_items = Vec::new();
        for item in staff_list {
            let has_user_account = self.has_user_account(item.id).await?;
            let mut response = StaffResponseDto::from(item);
            response.has_user_account = has_user_account;
            response_items.push(response);
        }

        Ok(response_items)
    }

    /// Check if employee_id exists
    async fn exists_by_employee_id(&self, employee_id: &str) -> ServiceResult<bool> {
        let count = Staff::find()
            .filter(staff::Column::EmployeeId.eq(employee_id))
            .filter(staff::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        Ok(count > 0)
    }

    /// Check if email exists
    async fn exists_by_email(&self, email: &str) -> ServiceResult<bool> {
        let count = Staff::find()
            .filter(staff::Column::Email.eq(email))
            .filter(staff::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        Ok(count > 0)
    }

    /// Check if staff member has a user account
    async fn has_user_account(&self, staff_id: Id) -> ServiceResult<bool> {
        let count = User::find()
            .filter(user::Column::StaffId.eq(staff_id))
            .filter(user::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        Ok(count > 0)
    }

    /// Get staff statistics
    pub async fn get_statistics(&self) -> ServiceResult<StaffStatistics> {
        let total = Staff::find()
            .filter(staff::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        let active = Staff::find()
            .filter(staff::Column::EmploymentStatus.eq(db_entity::staff::EmploymentStatus::Active))
            .filter(staff::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        let on_leave = Staff::find()
            .filter(staff::Column::EmploymentStatus.eq(db_entity::staff::EmploymentStatus::OnLeave))
            .filter(staff::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        let terminated = Staff::find()
            .filter(
                staff::Column::EmploymentStatus.eq(db_entity::staff::EmploymentStatus::Terminated),
            )
            .filter(staff::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        let full_time = Staff::find()
            .filter(staff::Column::WorkSchedule.eq(db_entity::staff::WorkSchedule::FullTime))
            .filter(staff::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        let part_time = Staff::find()
            .filter(staff::Column::WorkSchedule.eq(db_entity::staff::WorkSchedule::PartTime))
            .filter(staff::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        let contract = Staff::find()
            .filter(staff::Column::WorkSchedule.eq(db_entity::staff::WorkSchedule::Contract))
            .filter(staff::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await?;

        Ok(StaffStatistics {
            total,
            active,
            on_leave,
            terminated,
            full_time,
            part_time,
            contract,
        })
    }
}

/// Staff statistics
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct StaffStatistics {
    pub total: u64,
    pub active: u64,
    pub on_leave: u64,
    pub terminated: u64,
    pub full_time: u64,
    pub part_time: u64,
    pub contract: u64,
}
