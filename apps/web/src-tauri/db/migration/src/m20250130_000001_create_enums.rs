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

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop ENUM types in reverse order
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
