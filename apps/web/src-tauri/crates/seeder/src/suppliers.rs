use crate::Result;
use db_service::ServiceManager;
use std::sync::Arc;
use tracing::info;

/// Seed suppliers
/// This is a placeholder - implement when SupplierService is available
pub async fn seed(_service_manager: &Arc<ServiceManager>) -> Result<()> {
    info!("Seeding suppliers...");

    // TODO: Implement supplier seeding when SupplierService is created
    // This would use the supplier service to create suppliers with:
    // - Supplier name
    // - Contact information (phone, WhatsApp, email)
    // - Address
    // - Rating
    // - Notes

    info!("Supplier seeding skipped (not yet implemented)");
    Ok(())
}
