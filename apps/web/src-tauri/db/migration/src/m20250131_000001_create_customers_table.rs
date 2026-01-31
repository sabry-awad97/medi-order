use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("customers"))
                    .if_not_exists()
                    .col(ColumnDef::new(Customer::Id).uuid().not_null().primary_key())
                    .col(
                        ColumnDef::new(Customer::FullName)
                            .string_len(200)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Customer::PhoneNumber)
                            .string_len(20)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Customer::AltPhoneNumber)
                            .string_len(20)
                            .null(),
                    )
                    .col(ColumnDef::new(Customer::Email).string_len(255).null())
                    .col(ColumnDef::new(Customer::Address).text().null())
                    .col(ColumnDef::new(Customer::DateOfBirth).date().null())
                    .col(ColumnDef::new(Customer::NationalId).string_len(50).null())
                    .col(ColumnDef::new(Customer::Notes).text().null())
                    .col(
                        ColumnDef::new(Customer::IsActive)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(ColumnDef::new(Customer::CreatedBy).uuid().null())
                    .col(ColumnDef::new(Customer::UpdatedBy).uuid().null())
                    .col(
                        ColumnDef::new(Customer::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Customer::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Customer::DeletedAt)
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
                    .name("idx_customers_full_name")
                    .table(Alias::new("customers"))
                    .col(Customer::FullName)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_customers_phone_number")
                    .table(Alias::new("customers"))
                    .col(Customer::PhoneNumber)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_customers_email")
                    .table(Alias::new("customers"))
                    .col(Customer::Email)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_customers_national_id")
                    .table(Alias::new("customers"))
                    .col(Customer::NationalId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_customers_is_active")
                    .table(Alias::new("customers"))
                    .col(Customer::IsActive)
                    .to_owned(),
            )
            .await?;

        // Partial index for active customers (soft delete)
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_customers_active ON customers (id) WHERE deleted_at IS NULL;",
            )
            .await?;

        // Create trigger to auto-update updated_at
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_customers_updated_at
                    BEFORE UPDATE ON customers
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
            .execute_unprepared("DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;")
            .await?;

        // Drop table (indexes will be dropped automatically)
        manager
            .drop_table(Table::drop().table(Alias::new("customers")).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Customer {
    Id,
    FullName,
    PhoneNumber,
    AltPhoneNumber,
    Email,
    Address,
    DateOfBirth,
    NationalId,
    Notes,
    IsActive,
    CreatedBy,
    UpdatedBy,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
}
