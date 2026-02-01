use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create employment_status ENUM type
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TYPE employment_status AS ENUM (
                    'active',
                    'on_leave',
                    'terminated'
                );
                "#,
            )
            .await?;

        // Create work_schedule ENUM type
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TYPE work_schedule AS ENUM (
                    'full_time',
                    'part_time',
                    'contract'
                );
                "#,
            )
            .await?;

        // Create user_status ENUM type
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TYPE user_status AS ENUM (
                    'active',
                    'inactive',
                    'suspended',
                    'pending_verification'
                );
                "#,
            )
            .await?;

        // Create special_order_status ENUM type
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TYPE special_order_status AS ENUM (
                    'pending',
                    'ordered',
                    'arrived',
                    'ready_for_pickup',
                    'delivered',
                    'cancelled'
                );
                "#,
            )
            .await?;

        // Create stock_adjustment_type ENUM type
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TYPE stock_adjustment_type AS ENUM (
                    'manual_adjustment',
                    'order_arrival',
                    'sale',
                    'damage',
                    'expiry',
                    'return',
                    'transfer',
                    'initial_stock',
                    'opening_balance'
                );
                "#,
            )
            .await?;

        // Create opening_balance_entry_type ENUM type
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TYPE opening_balance_entry_type AS ENUM (
                    'initial',
                    'adjustment',
                    'correction',
                    'reconciliation'
                );
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop ENUM types in reverse order
        manager
            .get_connection()
            .execute_unprepared("DROP TYPE IF EXISTS opening_balance_entry_type CASCADE;")
            .await?;

        manager
            .get_connection()
            .execute_unprepared("DROP TYPE IF EXISTS stock_adjustment_type CASCADE;")
            .await?;

        manager
            .get_connection()
            .execute_unprepared("DROP TYPE IF EXISTS special_order_status CASCADE;")
            .await?;

        manager
            .get_connection()
            .execute_unprepared("DROP TYPE IF EXISTS user_status CASCADE;")
            .await?;

        manager
            .get_connection()
            .execute_unprepared("DROP TYPE IF EXISTS work_schedule CASCADE;")
            .await?;

        manager
            .get_connection()
            .execute_unprepared("DROP TYPE IF EXISTS employment_status CASCADE;")
            .await?;

        Ok(())
    }
}
