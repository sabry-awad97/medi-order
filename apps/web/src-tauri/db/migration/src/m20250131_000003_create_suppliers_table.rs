use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("suppliers"))
                    .if_not_exists()
                    .col(ColumnDef::new(Supplier::Id).uuid().not_null().primary_key())
                    .col(ColumnDef::new(Supplier::Name).string_len(200).not_null())
                    .col(ColumnDef::new(Supplier::Phone).string_len(20).not_null())
                    .col(ColumnDef::new(Supplier::Whatsapp).string_len(20).null())
                    .col(ColumnDef::new(Supplier::Email).string_len(255).null())
                    .col(ColumnDef::new(Supplier::Address).text().null())
                    .col(ColumnDef::new(Supplier::Rating).decimal_len(2, 1).null())
                    .col(ColumnDef::new(Supplier::Notes).text().null())
                    .col(
                        ColumnDef::new(Supplier::IsActive)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(ColumnDef::new(Supplier::CreatedBy).uuid().null())
                    .col(ColumnDef::new(Supplier::UpdatedBy).uuid().null())
                    .col(
                        ColumnDef::new(Supplier::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Supplier::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Supplier::DeletedAt)
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
                    .name("idx_suppliers_name")
                    .table(Alias::new("suppliers"))
                    .col(Supplier::Name)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_suppliers_rating")
                    .table(Alias::new("suppliers"))
                    .col(Supplier::Rating)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_suppliers_is_active")
                    .table(Alias::new("suppliers"))
                    .col(Supplier::IsActive)
                    .to_owned(),
            )
            .await?;

        // Partial index for active suppliers (soft delete)
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_suppliers_active ON suppliers (id) WHERE deleted_at IS NULL;",
            )
            .await?;

        // Create trigger to auto-update updated_at
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_suppliers_updated_at
                    BEFORE UPDATE ON suppliers
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
            .execute_unprepared("DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;")
            .await?;

        // Drop table (indexes will be dropped automatically)
        manager
            .drop_table(Table::drop().table(Alias::new("suppliers")).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Supplier {
    Id,
    Name,
    Phone,
    Whatsapp,
    Email,
    Address,
    Rating,
    Notes,
    IsActive,
    CreatedBy,
    UpdatedBy,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
}
