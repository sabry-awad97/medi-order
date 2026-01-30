use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Staff::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Staff::Id).uuid().not_null().primary_key())
                    .col(ColumnDef::new(Staff::FullName).text().not_null())
                    .col(
                        ColumnDef::new(Staff::EmployeeId)
                            .string_len(50)
                            .not_null()
                            .unique_key(),
                    )
                    .col(ColumnDef::new(Staff::Position).text().not_null())
                    .col(ColumnDef::new(Staff::Department).text().not_null())
                    .col(ColumnDef::new(Staff::Phone).string_len(20).not_null())
                    .col(ColumnDef::new(Staff::Email).string_len(255).not_null())
                    .col(
                        ColumnDef::new(Staff::EmploymentStatus)
                            .custom(Alias::new("employment_status"))
                            .not_null(),
                    )
                    .col(ColumnDef::new(Staff::HireDate).date().not_null())
                    .col(ColumnDef::new(Staff::TerminationDate).date().null())
                    .col(
                        ColumnDef::new(Staff::WorkSchedule)
                            .custom(Alias::new("work_schedule"))
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Staff::Compensation)
                            .decimal_len(12, 2)
                            .null(),
                    )
                    .col(ColumnDef::new(Staff::EmergencyContactName).text().null())
                    .col(
                        ColumnDef::new(Staff::EmergencyContactPhone)
                            .string_len(20)
                            .null(),
                    )
                    .col(ColumnDef::new(Staff::Notes).text().null())
                    .col(ColumnDef::new(Staff::CreatedBy).uuid().null())
                    .col(ColumnDef::new(Staff::UpdatedBy).uuid().null())
                    .col(
                        ColumnDef::new(Staff::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Staff::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Staff::DeletedAt)
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
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';

                CREATE TRIGGER update_staff_updated_at
                    BEFORE UPDATE ON staff
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
            .execute_unprepared("DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;")
            .await?;

        // Drop table
        manager
            .drop_table(Table::drop().table(Staff::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Staff {
    Table,
    Id,
    FullName,
    EmployeeId,
    Position,
    Department,
    Phone,
    Email,
    EmploymentStatus,
    HireDate,
    TerminationDate,
    WorkSchedule,
    Compensation,
    EmergencyContactName,
    EmergencyContactPhone,
    Notes,
    CreatedBy,
    UpdatedBy,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
}
