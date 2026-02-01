# App Seeder

Database seeding crate for the MediTrack application.

## Overview

This crate provides functionality to seed the database with initial data for development and testing purposes. It uses the `ServiceManager` and database services to ensure data integrity and proper validation.

## Features

- **Roles**: Seeds system roles (admin, manager, pharmacist, technician, viewer) with permissions
- **Medicine Forms**: Seeds 200+ pharmaceutical forms from JSON (tablets, capsules, syrups, etc.)
- **Manufacturers**: Seeds pharmaceutical manufacturers with contact information using bulk insert
- **Inventory**: Seeds inventory items with stock levels (TODO)
- **Suppliers**: Seeds supplier information with ratings (TODO)

## Usage

```rust
use app_seeder::Seeder;
use db_service::{DatabaseConfig, JwtConfig, ServiceManager};
use std::sync::Arc;

// Initialize service manager
let db_config = DatabaseConfig {
    url: "sqlite://meditrack.db?mode=rwc".to_string(),
    max_connections: 10,
    min_connections: 2,
    connect_timeout: 30,
    idle_timeout: 600,
};

let jwt_config = JwtConfig {
    secret: "your-secret-key".to_string(),
    issuer: "meditrack".to_string(),
    audience: "meditrack-app".to_string(),
    expiration_hours: 24,
};

let service_manager = Arc::new(ServiceManager::init(db_config, jwt_config).await?);

// Create seeder instance
let seeder = Seeder::new(service_manager);

// Seed all data
seeder.seed_all().await?;

// Or seed specific data
seeder.seed_roles().await?;
seeder.seed_medicine_forms().await?;
seeder.seed_manufacturers().await?;
seeder.seed_suppliers().await?;
```

## Running Examples

```bash
# Seed all data
cargo run --example seed_db

# Seed specific data
cargo run --example seed_selective -- --roles --medicine-forms --manufacturers
cargo run --example seed_selective -- --all
```

## Seeding Order

The seeder runs in the following order to respect foreign key dependencies:

1. Roles (no dependencies)
2. Medicine Forms (no dependencies)
3. Manufacturers (no dependencies)
4. Inventory Items (depends on medicine forms and manufacturers) - TODO
5. Suppliers (no dependencies) - TODO

## Features

### Idempotent Seeding

- All seeders check for existing data before inserting
- Running the seeder multiple times is safe and won't create duplicates
- Provides detailed logging of created vs skipped records

### Bulk Operations

- Manufacturers use bulk insert for better performance
- Falls back to individual inserts if bulk fails (e.g., due to duplicates)

### Service Integration

- Uses `ServiceManager` for proper service access
- Leverages existing validation and business logic
- Maintains data integrity through service layer

### JSON Data Loading

- Medicine forms and roles loaded from JSON files using `include_str!`
- Data embedded at compile time for zero runtime overhead
- Easy to update seed data by editing JSON files

## Data Sources

The seed data is based on:

- System roles with hierarchical permissions (admin, manager, pharmacist, technician, viewer)
- 200+ pharmaceutical forms from comprehensive JSON data
- Real pharmaceutical companies and their information
- Common medications with proper concentrations
- Arabic and English translations for bilingual support
- Realistic supplier information with ratings

## Data Included

### Roles (5 items)

- **Admin** (Level 100): Full system access
- **Manager** (Level 75): Management and reporting
- **Pharmacist** (Level 50): Order and inventory management
- **Technician** (Level 30): Order entry and basic inventory
- **Viewer** (Level 10): Read-only access

### Medicine Forms (200+ items)

Loaded from `data/medicine_forms.json`:

- Oral solid dosage (tablets, capsules, etc.)
- Liquid forms (syrups, suspensions, solutions)
- Topical forms (creams, ointments, gels)
- Injectable forms (ampoules, vials)
- And many more...

### Manufacturers (9 items)

- GSK, Pfizer, Sanofi, Bayer
- Abbott, Novartis, Grünenthal
- MSD, Various
- Includes contact information

## Development

To add new seed data:

1. Create a new module in `src/` (e.g., `src/my_data.rs`)
2. Create a JSON file in `data/` if using JSON data
3. Define your data structures and use `include_str!` to load JSON
4. Implement the `seed()` function using the appropriate service
5. Add the module to `lib.rs`
6. Call it from `Seeder::seed_all()` in the correct order

## Notes

- All IDs use UUIDv7 for time-ordered unique identifiers
- Seed data includes both English and Arabic translations
- The seeder is idempotent - running it multiple times is safe
- Uses service layer for validation and business logic
- Provides detailed logging for debugging
- JSON data is embedded at compile time using `include_str!`
