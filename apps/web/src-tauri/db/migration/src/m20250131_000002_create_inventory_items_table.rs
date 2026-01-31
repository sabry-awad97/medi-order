use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // ========================================
        // Create inventory_items table (Catalog/Master Data)
        // ========================================
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

        // Create indexes for inventory_items
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

        // Partial index for active items (soft delete)
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_inventory_items_active ON inventory_items (id) WHERE deleted_at IS NULL;",
            )
            .await?;

        // Create trigger to auto-update updated_at for inventory_items
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

        // ========================================
        // Create inventory_stock table (Transactional Data)
        // ========================================
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("inventory_stock"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(InventoryStock::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(InventoryStock::InventoryItemId)
                            .uuid()
                            .not_null()
                            .unique_key(), // One-to-one relationship
                    )
                    .col(
                        ColumnDef::new(InventoryStock::StockQuantity)
                            .integer()
                            .not_null()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new(InventoryStock::MinStockLevel)
                            .integer()
                            .not_null()
                            .default(10),
                    )
                    .col(
                        ColumnDef::new(InventoryStock::UnitPrice)
                            .decimal_len(10, 2)
                            .not_null()
                            .default(0.00),
                    )
                    .col(
                        ColumnDef::new(InventoryStock::LastRestockedAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(InventoryStock::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(InventoryStock::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_inventory_stock_inventory_item")
                            .from(
                                Alias::new("inventory_stock"),
                                InventoryStock::InventoryItemId,
                            )
                            .to(Alias::new("inventory_items"), InventoryItem::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create indexes for inventory_stock
        manager
            .create_index(
                Index::create()
                    .name("idx_inventory_stock_inventory_item_id")
                    .table(Alias::new("inventory_stock"))
                    .col(InventoryStock::InventoryItemId)
                    .to_owned(),
            )
            .await?;

        // Partial index for low stock items
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_inventory_stock_low_stock ON inventory_stock (inventory_item_id) WHERE stock_quantity <= min_stock_level;",
            )
            .await?;

        // Partial index for out of stock items
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_inventory_stock_out_of_stock ON inventory_stock (inventory_item_id) WHERE stock_quantity = 0;",
            )
            .await?;

        // Create trigger to auto-update updated_at for inventory_stock
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_inventory_stock_updated_at
                    BEFORE UPDATE ON inventory_stock
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop inventory_stock table first (due to foreign key)
        manager
            .get_connection()
            .execute_unprepared(
                "DROP TRIGGER IF EXISTS update_inventory_stock_updated_at ON inventory_stock;",
            )
            .await?;

        manager
            .drop_table(
                Table::drop()
                    .table(Alias::new("inventory_stock"))
                    .to_owned(),
            )
            .await?;

        // Drop inventory_items table
        manager
            .get_connection()
            .execute_unprepared(
                "DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;",
            )
            .await?;

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

#[derive(DeriveIden)]
enum InventoryStock {
    Id,
    InventoryItemId,
    StockQuantity,
    MinStockLevel,
    UnitPrice,
    LastRestockedAt,
    CreatedAt,
    UpdatedAt,
}
