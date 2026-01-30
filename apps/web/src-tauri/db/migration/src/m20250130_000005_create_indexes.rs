use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // ===== STAFF TABLE INDEXES =====

        // Index on employee_id for fast lookups
        manager
            .create_index(
                Index::create()
                    .name("idx_staff_employee_id")
                    .table(Staff::Table)
                    .col(Staff::EmployeeId)
                    .to_owned(),
            )
            .await?;

        // Index on employment_status for filtering active staff
        manager
            .create_index(
                Index::create()
                    .name("idx_staff_employment_status")
                    .table(Staff::Table)
                    .col(Staff::EmploymentStatus)
                    .to_owned(),
            )
            .await?;

        // Index on department for department-based queries
        manager
            .create_index(
                Index::create()
                    .name("idx_staff_department")
                    .table(Staff::Table)
                    .col(Staff::Department)
                    .to_owned(),
            )
            .await?;

        // Index on position for role-based queries
        manager
            .create_index(
                Index::create()
                    .name("idx_staff_position")
                    .table(Staff::Table)
                    .col(Staff::Position)
                    .to_owned(),
            )
            .await?;

        // Index on email for lookups
        manager
            .create_index(
                Index::create()
                    .name("idx_staff_email")
                    .table(Staff::Table)
                    .col(Staff::Email)
                    .to_owned(),
            )
            .await?;

        // Partial index for active (non-deleted) staff
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE INDEX idx_staff_active
                ON staff(id)
                WHERE deleted_at IS NULL;
                "#,
            )
            .await?;

        // Composite index for common queries (employment_status + deleted_at)
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE INDEX idx_staff_employment_active
                ON staff(employment_status, id)
                WHERE deleted_at IS NULL;
                "#,
            )
            .await?;

        // ===== ROLES TABLE INDEXES =====

        // Index on name for role lookups
        manager
            .create_index(
                Index::create()
                    .name("idx_roles_name")
                    .table(Roles::Table)
                    .col(Roles::Name)
                    .to_owned(),
            )
            .await?;

        // Index on level for permission hierarchy queries
        manager
            .create_index(
                Index::create()
                    .name("idx_roles_level")
                    .table(Roles::Table)
                    .col(Roles::Level)
                    .to_owned(),
            )
            .await?;

        // GIN index on permissions JSONB for efficient JSON queries
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE INDEX idx_roles_permissions
                ON roles USING GIN (permissions);
                "#,
            )
            .await?;

        // Partial index for active (non-deleted) roles
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE INDEX idx_roles_active
                ON roles(id)
                WHERE deleted_at IS NULL;
                "#,
            )
            .await?;

        // Composite index for active system roles
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE INDEX idx_roles_system_active
                ON roles(is_system, is_active, id)
                WHERE deleted_at IS NULL;
                "#,
            )
            .await?;

        // ===== USERS TABLE INDEXES =====

        // Index on staff_id for staff-user relationship
        manager
            .create_index(
                Index::create()
                    .name("idx_users_staff_id")
                    .table(Users::Table)
                    .col(Users::StaffId)
                    .to_owned(),
            )
            .await?;

        // Index on username for login
        manager
            .create_index(
                Index::create()
                    .name("idx_users_username")
                    .table(Users::Table)
                    .col(Users::Username)
                    .to_owned(),
            )
            .await?;

        // Index on email for login and lookups
        manager
            .create_index(
                Index::create()
                    .name("idx_users_email")
                    .table(Users::Table)
                    .col(Users::Email)
                    .to_owned(),
            )
            .await?;

        // Index on role_id for role-based queries
        manager
            .create_index(
                Index::create()
                    .name("idx_users_role_id")
                    .table(Users::Table)
                    .col(Users::RoleId)
                    .to_owned(),
            )
            .await?;

        // Index on supervisor_id for organizational hierarchy
        manager
            .create_index(
                Index::create()
                    .name("idx_users_supervisor_id")
                    .table(Users::Table)
                    .col(Users::SupervisorId)
                    .to_owned(),
            )
            .await?;

        // Index on status for filtering by user status
        manager
            .create_index(
                Index::create()
                    .name("idx_users_status")
                    .table(Users::Table)
                    .col(Users::Status)
                    .to_owned(),
            )
            .await?;

        // Index on is_active for filtering active users
        manager
            .create_index(
                Index::create()
                    .name("idx_users_is_active")
                    .table(Users::Table)
                    .col(Users::IsActive)
                    .to_owned(),
            )
            .await?;

        // Index on last_login_at for activity tracking
        manager
            .create_index(
                Index::create()
                    .name("idx_users_last_login_at")
                    .table(Users::Table)
                    .col(Users::LastLoginAt)
                    .to_owned(),
            )
            .await?;

        // Partial index for active (non-deleted) users
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE INDEX idx_users_active
                ON users(id)
                WHERE deleted_at IS NULL;
                "#,
            )
            .await?;

        // Composite index for active users with specific status
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE INDEX idx_users_status_active
                ON users(status, is_active, id)
                WHERE deleted_at IS NULL;
                "#,
            )
            .await?;

        // Composite index for role-based active users
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE INDEX idx_users_role_active
                ON users(role_id, is_active, id)
                WHERE deleted_at IS NULL;
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop all indexes in reverse order

        // Users table indexes
        manager
            .get_connection()
            .execute_unprepared("DROP INDEX IF EXISTS idx_users_role_active;")
            .await?;
        manager
            .get_connection()
            .execute_unprepared("DROP INDEX IF EXISTS idx_users_status_active;")
            .await?;
        manager
            .get_connection()
            .execute_unprepared("DROP INDEX IF EXISTS idx_users_active;")
            .await?;
        manager
            .drop_index(Index::drop().name("idx_users_last_login_at").to_owned())
            .await?;
        manager
            .drop_index(Index::drop().name("idx_users_is_active").to_owned())
            .await?;
        manager
            .drop_index(Index::drop().name("idx_users_status").to_owned())
            .await?;
        manager
            .drop_index(Index::drop().name("idx_users_supervisor_id").to_owned())
            .await?;
        manager
            .drop_index(Index::drop().name("idx_users_role_id").to_owned())
            .await?;
        manager
            .drop_index(Index::drop().name("idx_users_email").to_owned())
            .await?;
        manager
            .drop_index(Index::drop().name("idx_users_username").to_owned())
            .await?;
        manager
            .drop_index(Index::drop().name("idx_users_staff_id").to_owned())
            .await?;

        // Roles table indexes
        manager
            .get_connection()
            .execute_unprepared("DROP INDEX IF EXISTS idx_roles_system_active;")
            .await?;
        manager
            .get_connection()
            .execute_unprepared("DROP INDEX IF EXISTS idx_roles_active;")
            .await?;
        manager
            .get_connection()
            .execute_unprepared("DROP INDEX IF EXISTS idx_roles_permissions;")
            .await?;
        manager
            .drop_index(Index::drop().name("idx_roles_level").to_owned())
            .await?;
        manager
            .drop_index(Index::drop().name("idx_roles_name").to_owned())
            .await?;

        // Staff table indexes
        manager
            .get_connection()
            .execute_unprepared("DROP INDEX IF EXISTS idx_staff_employment_active;")
            .await?;
        manager
            .get_connection()
            .execute_unprepared("DROP INDEX IF EXISTS idx_staff_active;")
            .await?;
        manager
            .drop_index(Index::drop().name("idx_staff_email").to_owned())
            .await?;
        manager
            .drop_index(Index::drop().name("idx_staff_position").to_owned())
            .await?;
        manager
            .drop_index(Index::drop().name("idx_staff_department").to_owned())
            .await?;
        manager
            .drop_index(Index::drop().name("idx_staff_employment_status").to_owned())
            .await?;
        manager
            .drop_index(Index::drop().name("idx_staff_employee_id").to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Staff {
    Table,
    EmployeeId,
    EmploymentStatus,
    Department,
    Position,
    Email,
}

#[derive(DeriveIden)]
enum Roles {
    Table,
    Name,
    Level,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    StaffId,
    Username,
    Email,
    RoleId,
    SupervisorId,
    Status,
    IsActive,
    LastLoginAt,
}
