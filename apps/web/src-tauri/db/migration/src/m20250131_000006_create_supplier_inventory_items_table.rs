use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("supplier_inventory_items"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(SupplierInventoryItem::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(SupplierInventoryItem::SupplierId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(SupplierInventoryItem::InventoryItemId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(SupplierInventoryItem::SupplierPrice)
                            .decimal_len(10, 2)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(SupplierInventoryItem::DeliveryDays)
                            .integer()
                            .not_null()
                            .default(7),
                    )
                    .col(
                        ColumnDef::new(SupplierInventoryItem::MinOrderQuantity)
                            .integer()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(SupplierInventoryItem::IsPreferred)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .col(
                        ColumnDef::new(SupplierInventoryItem::IsActive)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(
                        ColumnDef::new(SupplierInventoryItem::LastOrderDate)
                            .date()
                            .null(),
                    )
                    .col(ColumnDef::new(SupplierInventoryItem::Notes).text().null())
                    .col(
                        ColumnDef::new(SupplierInventoryItem::CreatedBy)
                            .uuid()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(SupplierInventoryItem::UpdatedBy)
                            .uuid()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(SupplierInventoryItem::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(SupplierInventoryItem::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_supplier_inventory_items_supplier")
                            .from(
                                Alias::new("supplier_inventory_items"),
                                SupplierInventoryItem::SupplierId,
                            )
                            .to(Alias::new("suppliers"), Supplier::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_supplier_inventory_items_inventory")
                            .from(
                                Alias::new("supplier_inventory_items"),
                                SupplierInventoryItem::InventoryItemId,
                            )
                            .to(Alias::new("inventory_items"), InventoryItem::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create indexes
        manager
            .create_index(
                Index::create()
                    .name("idx_supplier_inventory_items_supplier_id")
                    .table(Alias::new("supplier_inventory_items"))
                    .col(SupplierInventoryItem::SupplierId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_supplier_inventory_items_inventory_id")
                    .table(Alias::new("supplier_inventory_items"))
                    .col(SupplierInventoryItem::InventoryItemId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_supplier_inventory_items_is_preferred")
                    .table(Alias::new("supplier_inventory_items"))
                    .col(SupplierInventoryItem::IsPreferred)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_supplier_inventory_items_is_active")
                    .table(Alias::new("supplier_inventory_items"))
                    .col(SupplierInventoryItem::IsActive)
                    .to_owned(),
            )
            .await?;

        // Composite unique index to prevent duplicate supplier-inventory relationships
        manager
            .create_index(
                Index::create()
                    .name("idx_supplier_inventory_items_unique")
                    .table(Alias::new("supplier_inventory_items"))
                    .col(SupplierInventoryItem::SupplierId)
                    .col(SupplierInventoryItem::InventoryItemId)
                    .unique()
                    .to_owned(),
            )
            .await?;

        // Create trigger to auto-update updated_at
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_supplier_inventory_items_updated_at
                    BEFORE UPDATE ON supplier_inventory_items
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
                "DROP TRIGGER IF EXISTS update_supplier_inventory_items_updated_at ON supplier_inventory_items;",
            )
            .await?;

        // Drop table (indexes and foreign keys will be dropped automatically)
        manager
            .drop_table(
                Table::drop()
                    .table(Alias::new("supplier_inventory_items"))
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum SupplierInventoryItem {
    Id,
    SupplierId,
    InventoryItemId,
    SupplierPrice,
    DeliveryDays,
    MinOrderQuantity,
    IsPreferred,
    IsActive,
    LastOrderDate,
    Notes,
    CreatedBy,
    UpdatedBy,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Supplier {
    Id,
}

#[derive(DeriveIden)]
enum InventoryItem {
    Id,
}
