use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Users::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Users::Id).uuid().not_null().primary_key())
                    .col(
                        ColumnDef::new(Users::StaffId)
                            .uuid()
                            .not_null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(Users::Username)
                            .string_len(100)
                            .not_null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(Users::Email)
                            .string_len(255)
                            .not_null()
                            .unique_key(),
                    )
                    .col(ColumnDef::new(Users::PasswordHash).text().not_null())
                    .col(ColumnDef::new(Users::FirstName).string_len(100).not_null())
                    .col(ColumnDef::new(Users::LastName).string_len(100).not_null())
                    .col(ColumnDef::new(Users::DisplayName).string_len(200).null())
                    .col(ColumnDef::new(Users::AvatarUrl).text().null())
                    .col(ColumnDef::new(Users::NpiNumber).string_len(10).null())
                    .col(ColumnDef::new(Users::SupervisorId).uuid().null())
                    .col(ColumnDef::new(Users::RoleId).uuid().not_null())
                    .col(
                        ColumnDef::new(Users::Status)
                            .custom(Alias::new("user_status"))
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Users::IsActive)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(
                        ColumnDef::new(Users::LastLoginAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .col(ColumnDef::new(Users::CreatedBy).uuid().null())
                    .col(ColumnDef::new(Users::UpdatedBy).uuid().null())
                    .col(
                        ColumnDef::new(Users::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Users::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Users::DeletedAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_users_staff_id")
                            .from(Users::Table, Users::StaffId)
                            .to(Staff::Table, Staff::Id)
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_users_role_id")
                            .from(Users::Table, Users::RoleId)
                            .to(Roles::Table, Roles::Id)
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_users_supervisor_id")
                            .from(Users::Table, Users::SupervisorId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create trigger to auto-update updated_at
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_users_updated_at
                    BEFORE UPDATE ON users
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
            .execute_unprepared("DROP TRIGGER IF EXISTS update_users_updated_at ON users;")
            .await?;

        // Drop table (foreign keys will be dropped automatically)
        manager
            .drop_table(Table::drop().table(Users::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
    StaffId,
    Username,
    Email,
    PasswordHash,
    FirstName,
    LastName,
    DisplayName,
    AvatarUrl,
    NpiNumber,
    SupervisorId,
    RoleId,
    Status,
    IsActive,
    LastLoginAt,
    CreatedBy,
    UpdatedBy,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
}

#[derive(DeriveIden)]
enum Staff {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Roles {
    Table,
    Id,
}
