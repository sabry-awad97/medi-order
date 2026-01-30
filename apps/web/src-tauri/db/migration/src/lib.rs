pub use sea_orm_migration::prelude::*;

mod m20250130_000001_create_enums;
mod m20250130_000002_create_staff_table;
mod m20250130_000003_create_roles_table;
mod m20250130_000004_create_users_table;
mod m20250130_000005_create_indexes;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20250130_000001_create_enums::Migration),
            Box::new(m20250130_000002_create_staff_table::Migration),
            Box::new(m20250130_000003_create_roles_table::Migration),
            Box::new(m20250130_000004_create_users_table::Migration),
            Box::new(m20250130_000005_create_indexes::Migration),
        ]
    }
}
