use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("special_order_items"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(SpecialOrderItem::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(SpecialOrderItem::SpecialOrderId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(SpecialOrderItem::InventoryItemId)
                            .uuid()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(SpecialOrderItem::CustomItemName)
                            .string_len(200)
                            .null(),
                    )
                    .col(
                        ColumnDef::new(SpecialOrderItem::CustomConcentration)
                            .string_len(50)
                            .null(),
                    )
                    .col(
                        ColumnDef::new(SpecialOrderItem::CustomForm)
                            .string_len(50)
                            .null(),
                    )
                    .col(
                        ColumnDef::new(SpecialOrderItem::Quantity)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(SpecialOrderItem::UnitPrice)
                            .decimal_len(10, 2)
                            .not_null(),
                    )
                    .col(ColumnDef::new(SpecialOrderItem::Notes).text().null())
                    .col(
                        ColumnDef::new(SpecialOrderItem::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(SpecialOrderItem::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_special_order_items_order")
                            .from(
                                Alias::new("special_order_items"),
                                SpecialOrderItem::SpecialOrderId,
                            )
                            .to(Alias::new("special_orders"), SpecialOrder::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_special_order_items_inventory")
                            .from(
                                Alias::new("special_order_items"),
                                SpecialOrderItem::InventoryItemId,
                            )
                            .to(Alias::new("inventory_items"), InventoryItem::Id)
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
                    .name("idx_special_order_items_order_id")
                    .table(Alias::new("special_order_items"))
                    .col(SpecialOrderItem::SpecialOrderId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_special_order_items_inventory_id")
                    .table(Alias::new("special_order_items"))
                    .col(SpecialOrderItem::InventoryItemId)
                    .to_owned(),
            )
            .await?;

        // Create trigger to auto-update updated_at
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_special_order_items_updated_at
                    BEFORE UPDATE ON special_order_items
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
                "DROP TRIGGER IF EXISTS update_special_order_items_updated_at ON special_order_items;",
            )
            .await?;

        // Drop table (indexes and foreign keys will be dropped automatically)
        manager
            .drop_table(
                Table::drop()
                    .table(Alias::new("special_order_items"))
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum SpecialOrderItem {
    Id,
    SpecialOrderId,
    InventoryItemId,
    CustomItemName,
    CustomConcentration,
    CustomForm,
    Quantity,
    UnitPrice,
    Notes,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum SpecialOrder {
    Id,
}

#[derive(DeriveIden)]
enum InventoryItem {
    Id,
}
