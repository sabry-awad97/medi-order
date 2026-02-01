# App Seeder

Database seeding utility for MediTrack application with TUI interface.

## Features

- Interactive TUI for easy database seeding
- Reads encrypted configuration from MediTrack config
- Supports selective or complete data seeding
- Async execution with proper state management
- Idempotent seeding (safe to run multiple times)

## Password & Configuration

The seeder reads database connection settings from the encrypted MediTrack configuration file.

### First Time Setup

If you haven't configured MediTrack yet:

1. Run the seeder - it will detect no configuration exists
2. You'll be prompted to create a new password
3. Default database settings will be used (PostgreSQL on localhost:5432)
4. The configuration will be saved encrypted

```bash
cargo run --bin seeder

# Output:
# No configuration found. Creating new configuration.
# Create configuration password: ****
# Confirm password: ****
```

### Using Existing Configuration

If you've already set up MediTrack configuration (using the config TUI):

1. Run the seeder
2. Enter your existing configuration password
3. Your saved database settings will be loaded

```bash
cargo run --bin seeder

# Output:
# Enter configuration password: ****
```

### Forgot Your Password?

If you forgot your password, you have two options:

1. **Delete the config and start fresh:**

   ```bash
   # Windows
   del %APPDATA%\meditrack\config.enc

   # Linux/Mac
   rm ~/.config/meditrack/config.enc
   ```

2. **Use the config TUI to manage configuration:**
   ```bash
   # Run the config TUI to view/edit settings
   cargo run --manifest-path apps/web/src-tauri/crates/config/Cargo.toml
   ```

## Usage

### Run the Seeder TUI

```bash
# From workspace root
cargo run --manifest-path apps/web/src-tauri/crates/seeder/Cargo.toml --bin seeder

# Or from the seeder directory
cd apps/web/src-tauri/crates/seeder
cargo run --bin seeder
```

### TUI Navigation

```
┌─ MediTrack Database Seeder ─────────────────────────────────┐
│ Populate database with initial data                          │
└──────────────────────────────────────────────────────────────┘

┌─ Select Data to Seed ───────────────────────────────────────┐
│                                                               │
│  > Seed All Data                                             │
│    Seed all available data types                             │
│                                                               │
│    Seed Roles                                                │
│    System roles with permissions                             │
│                                                               │
│    Seed Medicine Forms                                       │
│    200+ pharmaceutical forms                                 │
│                                                               │
│    Seed Manufacturers                                        │
│    Pharmaceutical manufacturers                              │
│                                                               │
│    Seed Inventory                                            │
│    Inventory items (TODO)                                    │
│                                                               │
│    Seed Suppliers                                            │
│    Supplier information (TODO)                               │
│                                                               │
│    Exit                                                      │
│    Quit the seeder                                           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Use ↑↓ to navigate, Enter to select, q to quit              │
└──────────────────────────────────────────────────────────────┘
```

**Controls:**

- **↑/↓ Arrow Keys**: Navigate menu options
- **Enter**: Select and execute the highlighted option
- **q or Esc**: Exit the application

### CLI Examples (Programmatic)

For automated scripts or CI/CD:

```bash
# Seed everything
cargo run --example seed_all --manifest-path apps/web/src-tauri/crates/seeder/Cargo.toml

# Seed specific types
cargo run --example seed_selective --manifest-path apps/web/src-tauri/crates/seeder/Cargo.toml -- --roles --medicine-forms
```

## Available Seeders

1. **Seed All Data** - Runs all seeders in dependency order
2. **Seed Roles** - Seeds 5 system roles (admin, manager, pharmacist, technician, viewer)
3. **Seed Medicine Forms** - Seeds 200+ pharmaceutical forms from JSON
4. **Seed Manufacturers** - Placeholder (TODO)
5. **Seed Inventory** - Placeholder (TODO)
6. **Seed Suppliers** - Placeholder (TODO)

## Data Files

Seed data is stored in JSON files under `data/`:

- `data/roles.json` - System roles with permissions
- `data/medicine_forms.json` - Medicine forms (200+ entries)

Data is loaded at compile time using `include_str!` macro for efficiency.

## Configuration Details

### Default Database Settings

If no configuration exists, these defaults are used:

```
Host: localhost
Port: 5432
Database: meditrack
Username: meditrack
Password: meditrack_dev_password
Max Connections: 10
Min Connections: 2
Connect Timeout: 30s
Idle Timeout: 600s
```

### Configuration Location

The encrypted configuration is stored at:

- **Windows**: `%APPDATA%\meditrack\config.enc`
- **Linux**: `~/.config/meditrack/config.enc`
- **macOS**: `~/Library/Application Support/meditrack/config.enc`

## Architecture

The seeder follows best practices:

- **Service Layer Pattern**: Uses `ServiceManager` to access services
- **Never Direct DB Access**: Calls service methods (e.g., `role().create_bulk()`)
- **Idempotent**: Safe to run multiple times with existence checks
- **Async Execution**: Uses reratui's `use_mutation` hook for proper async state management
- **Encrypted Config**: Reads from the same encrypted config as the main application

## Seeding Order

Data is seeded in dependency order:

1. Roles (no dependencies)
2. Medicine Forms (no dependencies)
3. Manufacturers (TODO)
4. Inventory (TODO - depends on medicine forms)
5. Suppliers (TODO)

## Troubleshooting

### "Failed to load configuration" Error

This usually means:

1. Wrong password entered
2. Configuration file is corrupted
3. Configuration file doesn't exist

**Solution**: Delete the config file and start fresh, or use the config TUI to fix it.

### Database Connection Errors

If you see connection errors:

1. Verify PostgreSQL is running
2. Check database credentials in config
3. Ensure database exists
4. Check network connectivity

### Migration Warnings

You may see warnings about migrations - this is normal if tables already exist.

## Development

To add new seeders:

1. Create JSON data file in `data/`
2. Create seeder module in `src/`
3. Implement using service methods
4. Register in `lib.rs`
5. Update menu in `tui/components/main_menu.rs`

## Related Tools

- **Config TUI**: Manage application configuration

  ```bash
  cargo run --manifest-path apps/web/src-tauri/crates/config/Cargo.toml
  ```

- **Migration Tool**: Manage database schema
  ```bash
  cargo run --manifest-path apps/web/src-tauri/db/migration/Cargo.toml
  ```
