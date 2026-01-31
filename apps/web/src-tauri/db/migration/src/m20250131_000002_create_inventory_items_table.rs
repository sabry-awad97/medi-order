use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("inventory_items"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(InventoryItem::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::Name)
                            .string_len(200)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::GenericName)
                            .string_len(200)
                            .null(),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::Concentration)
                            .string_len(50)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::Form)
                            .string_len(50)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::Manufacturer)
                            .string_len(200)
                            .null(),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::Barcode)
                            .string_len(100)
                            .null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::StockQuantity)
                            .integer()
                            .not_null()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::MinStockLevel)
                            .integer()
                            .not_null()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::UnitPrice)
                            .decimal_len(10, 2)
                            .not_null()
                            .default(0.00),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::RequiresPrescription)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::IsControlled)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::StorageInstructions)
                            .text()
                            .null(),
                    )
                    .col(ColumnDef::new(InventoryItem::Notes).text().null())
                    .col(
                        ColumnDef::new(InventoryItem::IsActive)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(ColumnDef::new(InventoryItem::CreatedBy).uuid().null())
                    .col(ColumnDef::new(InventoryItem::UpdatedBy).uuid().null())
                    .col(
                        ColumnDef::new(InventoryItem::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(InventoryItem::DeletedAt)
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
                    .name("idx_inventory_items_name")
                    .table(Alias::new("inventory_items"))
                    .col(InventoryItem::Name)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_inventory_items_generic_name")
                    .table(Alias::new("inventory_items"))
                    .col(InventoryItem::GenericName)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_inventory_items_form")
                    .table(Alias::new("inventory_items"))
                    .col(InventoryItem::Form)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_inventory_items_is_active")
                    .table(Alias::new("inventory_items"))
                    .col(InventoryItem::IsActive)
                    .to_owned(),
            )
            .await?;

        // Partial index for low stock items
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_inventory_items_low_stock ON inventory_items (id) WHERE stock_quantity < min_stock_level AND deleted_at IS NULL;",
            )
            .await?;

        // Partial index for active items (soft delete)
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_inventory_items_active ON inventory_items (id) WHERE deleted_at IS NULL;",
            )
            .await?;

        // Create trigger to auto-update updated_at
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_inventory_items_updated_at
                    BEFORE UPDATE ON inventory_items
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
                "DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;",
            )
            .await?;

        // Drop table (indexes will be dropped automatically)
        manager
            .drop_table(
                Table::drop()
                    .table(Alias::new("inventory_items"))
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum InventoryItem {
    Id,
    Name,
    GenericName,
    Concentration,
    Form,
    Manufacturer,
    Barcode,
    StockQuantity,
    MinStockLevel,
    UnitPrice,
    RequiresPrescription,
    IsControlled,
    StorageInstructions,
    Notes,
    IsActive,
    CreatedBy,
    UpdatedBy,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
}
