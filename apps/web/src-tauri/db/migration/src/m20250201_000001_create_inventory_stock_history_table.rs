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

        // ========================================
        // Create inventory_opening_balances table
        // ========================================
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("inventory_opening_balances"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::InventoryItemId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::EnteredBy)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::AdjustedFromId)
                            .uuid()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::Quantity)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::UnitPrice)
                            .decimal_len(10, 2)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::BatchNumber)
                            .string_len(100)
                            .null(),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::ExpiryDate)
                            .date()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::EntryDate)
                            .date()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::EntryType)
                            .custom(Alias::new("opening_balance_entry_type"))
                            .not_null()
                            .default("initial"),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::Reason)
                            .text()
                            .null(),
                    )
                    .col(ColumnDef::new(InventoryOpeningBalance::Notes).text().null())
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::ImportBatchId)
                            .uuid()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::ImportFileName)
                            .string_len(255)
                            .null(),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::IsActive)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::IsVerified)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::VerifiedBy)
                            .uuid()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::VerifiedAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(InventoryOpeningBalance::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_opening_balance_inventory_item")
                            .from(
                                Alias::new("inventory_opening_balances"),
                                InventoryOpeningBalance::InventoryItemId,
                            )
                            .to(Alias::new("inventory_items"), Alias::new("id"))
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_opening_balance_entered_by")
                            .from(
                                Alias::new("inventory_opening_balances"),
                                InventoryOpeningBalance::EnteredBy,
                            )
                            .to(Alias::new("users"), Alias::new("id"))
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_opening_balance_verified_by")
                            .from(
                                Alias::new("inventory_opening_balances"),
                                InventoryOpeningBalance::VerifiedBy,
                            )
                            .to(Alias::new("users"), Alias::new("id"))
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_opening_balance_adjusted_from")
                            .from(
                                Alias::new("inventory_opening_balances"),
                                InventoryOpeningBalance::AdjustedFromId,
                            )
                            .to(Alias::new("inventory_opening_balances"), Alias::new("id"))
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Add CHECK constraints
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                ALTER TABLE inventory_opening_balances
                ADD CONSTRAINT check_quantity_non_negative CHECK (quantity >= 0),
                ADD CONSTRAINT check_unit_price_non_negative CHECK (unit_price >= 0),
                ADD CONSTRAINT check_valid_expiry_date CHECK (expiry_date IS NULL OR expiry_date > entry_date),
                ADD CONSTRAINT check_adjustment_requires_reference CHECK (
                    (entry_type = 'initial' AND adjusted_from_id IS NULL) OR
                    (entry_type IN ('adjustment', 'correction') AND adjusted_from_id IS NOT NULL)
                );
                "#,
            )
            .await?;

        // Add computed column for total_value
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                ALTER TABLE inventory_opening_balances
                ADD COLUMN total_value DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED;
                "#,
            )
            .await?;

        // Create indexes for inventory_opening_balances
        manager
            .create_index(
                Index::create()
                    .name("idx_opening_balances_item")
                    .table(Alias::new("inventory_opening_balances"))
                    .col(InventoryOpeningBalance::InventoryItemId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_opening_balances_entry_date")
                    .table(Alias::new("inventory_opening_balances"))
                    .col(InventoryOpeningBalance::EntryDate)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_opening_balances_entered_by")
                    .table(Alias::new("inventory_opening_balances"))
                    .col(InventoryOpeningBalance::EnteredBy)
                    .to_owned(),
            )
            .await?;

        // Partial index for active records
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_opening_balances_active ON inventory_opening_balances (inventory_item_id) WHERE is_active = true;",
            )
            .await?;

        // Partial index for batch number
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_opening_balances_batch ON inventory_opening_balances (batch_number) WHERE batch_number IS NOT NULL;",
            )
            .await?;

        // Partial index for import batch
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_opening_balances_import ON inventory_opening_balances (import_batch_id) WHERE import_batch_id IS NOT NULL;",
            )
            .await?;

        // Partial index for verification status
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX idx_opening_balances_verification ON inventory_opening_balances (is_verified, verified_at);",
            )
            .await?;

        // Create trigger to auto-update updated_at for inventory_opening_balances
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_opening_balances_updated_at
                    BEFORE UPDATE ON inventory_opening_balances
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
                "#,
            )
            .await?;

        // Add comments for documentation
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                COMMENT ON TABLE inventory_opening_balances IS 
                    'Stores opening balance entries for inventory items with full audit trail';
                COMMENT ON COLUMN inventory_opening_balances.entry_type IS 
                    'Type: initial (first entry), adjustment (correction), correction (error fix), reconciliation (physical count)';
                COMMENT ON COLUMN inventory_opening_balances.total_value IS 
                    'Computed column: quantity * unit_price, automatically maintained by database';
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop opening balances trigger
        manager
            .get_connection()
            .execute_unprepared(
                "DROP TRIGGER IF EXISTS update_opening_balances_updated_at ON inventory_opening_balances;",
            )
            .await?;

        // Drop inventory_opening_balances table
        manager
            .drop_table(
                Table::drop()
                    .table(Alias::new("inventory_opening_balances"))
                    .if_exists()
                    .to_owned(),
            )
            .await?;

        // Drop stock history trigger
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

#[derive(DeriveIden)]
enum InventoryOpeningBalance {
    Id,
    InventoryItemId,
    EnteredBy,
    AdjustedFromId,
    Quantity,
    UnitPrice,
    BatchNumber,
    ExpiryDate,
    EntryDate,
    EntryType,
    Reason,
    Notes,
    ImportBatchId,
    ImportFileName,
    IsActive,
    IsVerified,
    VerifiedBy,
    VerifiedAt,
    CreatedAt,
    UpdatedAt,
}
