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

        // Create indexes
        manager
            .create_index(
                Index::create()
                    .name("idx_roles_name")
                    .table(Roles::Table)
                    .col(Roles::Name)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_roles_level")
                    .table(Roles::Table)
                    .col(Roles::Level)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_roles_is_active")
                    .table(Roles::Table)
                    .col(Roles::IsActive)
                    .to_owned(),
            )
            .await?;

        // GIN index for JSONB permissions field
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_roles_permissions ON roles USING GIN (permissions);",
            )
            .await?;

        // Partial index for active roles (soft delete)
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_roles_active ON roles (id) WHERE deleted_at IS NULL;",
            )
            .await?;

        // Composite index for system roles
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_roles_system_active ON roles (is_system, is_active) WHERE deleted_at IS NULL;",
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

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop trigger first
        manager
            .get_connection()
            .execute_unprepared("DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;")
            .await?;

        // Drop table (indexes will be dropped automatically)
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
