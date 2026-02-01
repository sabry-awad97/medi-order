use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // ========================================
        // Create medicine_forms table
        // ========================================
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("medicine_forms"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(MedicineForm::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(MedicineForm::Code)
                            .string_len(50)
                            .not_null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(MedicineForm::NameEn)
                            .string_len(100)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(MedicineForm::NameAr)
                            .string_len(100)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(MedicineForm::DisplayOrder)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(MedicineForm::IsActive)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(
                        ColumnDef::new(MedicineForm::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(MedicineForm::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Create indexes for medicine_forms
        manager
            .create_index(
                Index::create()
                    .name("idx_medicine_forms_code")
                    .table(Alias::new("medicine_forms"))
                    .col(MedicineForm::Code)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_medicine_forms_display_order")
                    .table(Alias::new("medicine_forms"))
                    .col(MedicineForm::DisplayOrder)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_medicine_forms_is_active")
                    .table(Alias::new("medicine_forms"))
                    .col(MedicineForm::IsActive)
                    .to_owned(),
            )
            .await?;

        // Create trigger to auto-update updated_at for medicine_forms
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_medicine_forms_updated_at
                    BEFORE UPDATE ON medicine_forms
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop trigger
        manager
            .get_connection()
            .execute_unprepared(
                "DROP TRIGGER IF EXISTS update_medicine_forms_updated_at ON medicine_forms;",
            )
            .await?;

        // Drop medicine_forms table
        manager
            .drop_table(
                Table::drop()
                    .table(Alias::new("medicine_forms"))
                    .if_exists()
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum MedicineForm {
    Id,
    Code,
    NameEn,
    NameAr,
    DisplayOrder,
    IsActive,
    CreatedAt,
    UpdatedAt,
}
