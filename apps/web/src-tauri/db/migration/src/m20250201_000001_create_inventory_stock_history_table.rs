use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // ========================================
        // Create inventory_stock_history table
        // ========================================
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("inventory_stock_history"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(InventoryStockHistory::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(InventoryStockHistory::InventoryItemId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryStockHistory::AdjustmentType)
                            .custom(Alias::new("stock_adjustment_type"))
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryStockHistory::QuantityBefore)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryStockHistory::QuantityAfter)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryStockHistory::AdjustmentAmount)
                            .integer()
                            .not_null(),
                    )
                    .col(ColumnDef::new(InventoryStockHistory::Reason).text().null())
                    .col(
                        ColumnDef::new(InventoryStockHistory::ReferenceId)
                            .uuid()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(InventoryStockHistory::ReferenceType)
                            .string_len(50)
                            .null(),
                    )
                    .col(
                        ColumnDef::new(InventoryStockHistory::RecordedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(InventoryStockHistory::RecordedBy)
                            .uuid()
                            .null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_stock_history_inventory_item")
                            .from(
                                Alias::new("inventory_stock_history"),
                                InventoryStockHistory::InventoryItemId,
                            )
                            .to(Alias::new("inventory_items"), Alias::new("id"))
                            .on_delete(ForeignKeyAction::NoAction)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create composite index on (inventory_item_id, recorded_at DESC)
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_stock_history_item_time ON inventory_stock_history (inventory_item_id, recorded_at DESC);",
            )
            .await?;

        // Create index on recorded_at for time-based queries
        manager
            .create_index(
                Index::create()
                    .name("idx_stock_history_recorded_at")
                    .table(Alias::new("inventory_stock_history"))
                    .col(InventoryStockHistory::RecordedAt)
                    .to_owned(),
            )
            .await?;

        // Create index on adjustment_type for filtering
        manager
            .create_index(
                Index::create()
                    .name("idx_stock_history_adjustment_type")
                    .table(Alias::new("inventory_stock_history"))
                    .col(InventoryStockHistory::AdjustmentType)
                    .to_owned(),
            )
            .await?;

        // Create trigger function to record stock changes
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE OR REPLACE FUNCTION record_stock_change()
                RETURNS TRIGGER AS $$
                BEGIN
                    BEGIN
                        -- Only record if stock quantity actually changed
                        IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity THEN
                            INSERT INTO inventory_stock_history (
                                id,
                                inventory_item_id,
                                adjustment_type,
                                quantity_before,
                                quantity_after,
                                adjustment_amount,
                                reason,
                                reference_id,
                                reference_type,
                                recorded_at,
                                recorded_by
                            ) VALUES (
                                gen_random_uuid(),
                                NEW.inventory_item_id,
                                'manual_adjustment'::stock_adjustment_type,
                                OLD.stock_quantity,
                                NEW.stock_quantity,
                                NEW.stock_quantity - OLD.stock_quantity,
                                NULL,
                                NULL,
                                NULL,
                                NOW(),
                                NULL
                            );
                        END IF;
                    EXCEPTION
                        WHEN OTHERS THEN
                            -- Log error but don't block the stock update
                            RAISE WARNING 'Failed to record stock history: %', SQLERRM;
                    END;
                    
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                "#,
            )
            .await?;

        // Attach trigger to inventory_stock table
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER stock_history_trigger
                    AFTER UPDATE OF stock_quantity ON inventory_stock
                    FOR EACH ROW
                    EXECUTE FUNCTION record_stock_change();
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop trigger
        manager
            .get_connection()
            .execute_unprepared("DROP TRIGGER IF EXISTS stock_history_trigger ON inventory_stock;")
            .await?;

        // Drop function
        manager
            .get_connection()
            .execute_unprepared("DROP FUNCTION IF EXISTS record_stock_change();")
            .await?;

        // Drop inventory_stock_history table
        manager
            .drop_table(
                Table::drop()
                    .table(Alias::new("inventory_stock_history"))
                    .if_exists()
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum InventoryStockHistory {
    Id,
    InventoryItemId,
    AdjustmentType,
    QuantityBefore,
    QuantityAfter,
    AdjustmentAmount,
    Reason,
    ReferenceId,
    ReferenceType,
    RecordedAt,
    RecordedBy,
}
