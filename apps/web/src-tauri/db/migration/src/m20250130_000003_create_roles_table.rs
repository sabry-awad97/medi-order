use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Roles::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Roles::Id).uuid().not_null().primary_key())
                    .col(
                        ColumnDef::new(Roles::Name)
                            .string_len(50)
                            .not_null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(Roles::DisplayName)
                            .string_len(100)
                            .not_null(),
                    )
                    .col(ColumnDef::new(Roles::Description).text().null())
                    .col(ColumnDef::new(Roles::Level).integer().not_null())
                    .col(
                        ColumnDef::new(Roles::IsSystem)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .col(
                        ColumnDef::new(Roles::IsActive)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(ColumnDef::new(Roles::Permissions).json_binary().not_null())
                    .col(ColumnDef::new(Roles::CreatedBy).uuid().null())
                    .col(ColumnDef::new(Roles::UpdatedBy).uuid().null())
                    .col(
                        ColumnDef::new(Roles::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Roles::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Roles::DeletedAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .to_owned(),
            )
            .await?;

        // Create trigger to auto-update updated_at
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_roles_updated_at
                    BEFORE UPDATE ON roles
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
                "#,
            )
            .await?;

        // Insert default system roles
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                INSERT INTO roles (id, name, display_name, description, level, is_system, is_active, permissions, created_at, updated_at)
                VALUES
                    (
                        gen_random_uuid(),
                        'admin',
                        'Administrator',
                        'Full system access with all permissions',
                        100,
                        true,
                        true,
                        '["*"]'::jsonb,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    ),
                    (
                        gen_random_uuid(),
                        'manager',
                        'Manager',
                        'Management access with staff and reporting permissions',
                        75,
                        true,
                        true,
                        '["orders:*", "inventory:*", "reports:*", "staff:read", "staff:update"]'::jsonb,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    ),
                    (
                        gen_random_uuid(),
                        'pharmacist',
                        'Pharmacist',
                        'Pharmacist access with order and inventory management',
                        50,
                        true,
                        true,
                        '["orders:*", "inventory:read", "inventory:update", "reports:read"]'::jsonb,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    ),
                    (
                        gen_random_uuid(),
                        'technician',
                        'Pharmacy Technician',
                        'Technician access with order entry and basic inventory',
                        30,
                        true,
                        true,
                        '["orders:create", "orders:read", "orders:update", "inventory:read"]'::jsonb,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    ),
                    (
                        gen_random_uuid(),
                        'viewer',
                        'Viewer',
                        'Read-only access to orders and reports',
                        10,
                        true,
                        true,
                        '["orders:read", "reports:read"]'::jsonb,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    );
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop trigger first
        manager
            .get_connection()
            .execute_unprepared("DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;")
            .await?;

        // Drop table
        manager
            .drop_table(Table::drop().table(Roles::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Roles {
    Table,
    Id,
    Name,
    DisplayName,
    Description,
    Level,
    IsSystem,
    IsActive,
    Permissions,
    CreatedBy,
    UpdatedBy,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
}
