pub use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::DatabaseConnection;

mod m20250130_000001_create_enums;
mod m20250130_000002_create_staff_table;
mod m20250130_000003_create_roles_table;
mod m20250130_000004_create_users_table;
mod m20250131_000001_5_create_manufacturers_table;
mod m20250131_000001_create_customers_table;
mod m20250131_000002_1_create_inventory_stock_table;
mod m20250131_000002_2_create_inventory_price_history_table;
mod m20250131_000002_3_create_inventory_item_barcodes_table;
mod m20250131_000002_create_inventory_items_table;
mod m20250131_000003_create_suppliers_table;
mod m20250131_000004_create_special_orders_table;
mod m20250131_000005_create_special_order_items_table;
mod m20250131_000006_create_supplier_inventory_items_table;
mod m20250131_000007_create_settings_table;
mod m20250131_000008_create_sessions_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20250130_000001_create_enums::Migration),
            Box::new(m20250130_000002_create_staff_table::Migration),
            Box::new(m20250130_000003_create_roles_table::Migration),
            Box::new(m20250130_000004_create_users_table::Migration),
            Box::new(m20250131_000001_create_customers_table::Migration),
            Box::new(m20250131_000001_5_create_manufacturers_table::Migration),
            Box::new(m20250131_000002_create_inventory_items_table::Migration),
            Box::new(m20250131_000002_1_create_inventory_stock_table::Migration),
            Box::new(m20250131_000002_2_create_inventory_price_history_table::Migration),
            Box::new(m20250131_000002_3_create_inventory_item_barcodes_table::Migration),
            Box::new(m20250131_000003_create_suppliers_table::Migration),
            Box::new(m20250131_000004_create_special_orders_table::Migration),
            Box::new(m20250131_000005_create_special_order_items_table::Migration),
            Box::new(m20250131_000006_create_supplier_inventory_items_table::Migration),
            Box::new(m20250131_000007_create_settings_table::Migration),
            Box::new(m20250131_000008_create_sessions_table::Migration),
        ]
    }
}

pub async fn run_migrations(db: &DatabaseConnection) -> Result<(), DbErr> {
    Migrator::up(db, None).await
}
