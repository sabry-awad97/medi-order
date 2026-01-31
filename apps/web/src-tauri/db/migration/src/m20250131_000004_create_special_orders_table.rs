use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("special_orders"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(SpecialOrder::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(SpecialOrder::CustomerId).uuid().not_null())
                    .col(ColumnDef::new(SpecialOrder::SupplierId).uuid().null())
                    .col(
                        ColumnDef::new(SpecialOrder::OrderNumber)
                            .string_len(50)
                            .not_null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(SpecialOrder::Status)
                            .custom(Alias::new("special_order_status"))
                            .not_null(),
                    )
                    .col(ColumnDef::new(SpecialOrder::OrderDate).date().not_null())
                    .col(
                        ColumnDef::new(SpecialOrder::ExpectedArrivalDate)
                            .date()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(SpecialOrder::ActualArrivalDate)
                            .date()
                            .null(),
                    )
                    .col(ColumnDef::new(SpecialOrder::DeliveryDate).date().null())
                    .col(
                        ColumnDef::new(SpecialOrder::TotalAmount)
                            .decimal_len(10, 2)
                            .not_null()
                            .default(0.00),
                    )
                    .col(
                        ColumnDef::new(SpecialOrder::DepositPaid)
                            .decimal_len(10, 2)
                            .null(),
                    )
                    .col(ColumnDef::new(SpecialOrder::Notes).text().null())
                    .col(ColumnDef::new(SpecialOrder::InternalNotes).text().null())
                    .col(ColumnDef::new(SpecialOrder::CreatedBy).uuid().null())
                    .col(ColumnDef::new(SpecialOrder::UpdatedBy).uuid().null())
                    .col(
                        ColumnDef::new(SpecialOrder::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(SpecialOrder::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(SpecialOrder::DeletedAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_special_orders_customer")
                            .from(Alias::new("special_orders"), SpecialOrder::CustomerId)
                            .to(Alias::new("customers"), Customer::Id)
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_special_orders_supplier")
                            .from(Alias::new("special_orders"), SpecialOrder::SupplierId)
                            .to(Alias::new("suppliers"), Supplier::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create indexes
        manager
            .create_index(
                Index::create()
                    .name("idx_special_orders_customer_id")
                    .table(Alias::new("special_orders"))
                    .col(SpecialOrder::CustomerId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_special_orders_supplier_id")
                    .table(Alias::new("special_orders"))
                    .col(SpecialOrder::SupplierId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_special_orders_order_number")
                    .table(Alias::new("special_orders"))
                    .col(SpecialOrder::OrderNumber)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_special_orders_status")
                    .table(Alias::new("special_orders"))
                    .col(SpecialOrder::Status)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_special_orders_order_date")
                    .table(Alias::new("special_orders"))
                    .col(SpecialOrder::OrderDate)
                    .to_owned(),
            )
            .await?;

        // Partial index for active orders (soft delete)
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_special_orders_active ON special_orders (id) WHERE deleted_at IS NULL;",
            )
            .await?;

        // Create trigger to auto-update updated_at
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_special_orders_updated_at
                    BEFORE UPDATE ON special_orders
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
            .execute_unprepared(
                "DROP TRIGGER IF EXISTS update_special_orders_updated_at ON special_orders;",
            )
            .await?;

        // Drop table (indexes and foreign keys will be dropped automatically)
        manager
            .drop_table(Table::drop().table(Alias::new("special_orders")).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum SpecialOrder {
    Id,
    CustomerId,
    SupplierId,
    OrderNumber,
    Status,
    OrderDate,
    ExpectedArrivalDate,
    ActualArrivalDate,
    DeliveryDate,
    TotalAmount,
    DepositPaid,
    Notes,
    InternalNotes,
    CreatedBy,
    UpdatedBy,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
}

#[derive(DeriveIden)]
enum Customer {
    Id,
}

#[derive(DeriveIden)]
enum Supplier {
    Id,
}
