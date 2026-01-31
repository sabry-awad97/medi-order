use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("settings"))
                    .if_not_exists()
                    .col(ColumnDef::new(Setting::Id).uuid().not_null().primary_key())
                    .col(
                        ColumnDef::new(Setting::Key)
                            .string_len(100)
                            .not_null()
                            .unique_key(),
                    )
                    .col(ColumnDef::new(Setting::Value).json_binary().not_null())
                    .col(ColumnDef::new(Setting::Category).string_len(50).null())
                    .col(ColumnDef::new(Setting::Description).text().null())
                    .col(ColumnDef::new(Setting::UpdatedBy).uuid().null())
                    .col(
                        ColumnDef::new(Setting::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Setting::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Create index on key for fast lookups
        manager
            .create_index(
                Index::create()
                    .name("idx_settings_key")
                    .table(Alias::new("settings"))
                    .col(Setting::Key)
                    .to_owned(),
            )
            .await?;

        // Create index on category for filtering
        manager
            .create_index(
                Index::create()
                    .name("idx_settings_category")
                    .table(Alias::new("settings"))
                    .col(Setting::Category)
                    .to_owned(),
            )
            .await?;

        // Create trigger to auto-update updated_at
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_settings_updated_at
                    BEFORE UPDATE ON settings
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
            .execute_unprepared("DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;")
            .await?;

        // Drop table (indexes will be dropped automatically)
        manager
            .drop_table(Table::drop().table(Alias::new("settings")).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Setting {
    Id,
    Key,
    Value,
    Category,
    Description,
    UpdatedBy,
    CreatedAt,
    UpdatedAt,
}
