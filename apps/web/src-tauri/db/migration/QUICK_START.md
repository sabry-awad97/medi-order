# Migration Quick Start Guide

## Setup (One Time)

```bash
# Set database connection
export DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Or create .env file
echo "DATABASE_URL=postgresql://username:password@localhost:5432/database_name" > .env
```

## Common Commands

### Run All Migrations

```bash
cd apps/web/src-tauri/db/migration
cargo run -- up
```

### Check Status

```bash
cargo run -- status
```

### Rollback Last Migration

```bash
cargo run -- down
```

### Fresh Install (Drop All & Recreate)

```bash
cargo run -- fresh
```

### Refresh (Rollback All & Reapply)

```bash
cargo run -- refresh
```

## What Gets Created

### Tables

- ✅ `staff` - Employee records
- ✅ `roles` - Permission roles (5 default roles)
- ✅ `users` - User accounts

### ENUM Types

- ✅ `employment_status`
- ✅ `work_schedule`
- ✅ `user_status`

### Indexes

- ✅ 27 indexes for optimal query performance

### Triggers

- ✅ Auto-update `updated_at` on all tables

## Verify Installation

```bash
# Check tables
psql $DATABASE_URL -c "\dt"

# Check ENUM types
psql $DATABASE_URL -c "\dT"

# Check indexes
psql $DATABASE_URL -c "\di"

# Check default roles
psql $DATABASE_URL -c "SELECT name, display_name, level FROM roles ORDER BY level DESC;"
```

## Expected Output

### Tables Created

```
 Schema |   Name   | Type  |  Owner
--------+----------+-------+---------
 public | roles    | table | postgres
 public | staff    | table | postgres
 public | users    | table | postgres
```

### Default Roles

```
    name     |    display_name     | level
-------------+---------------------+-------
 admin       | Administrator       |   100
 manager     | Manager             |    75
 pharmacist  | Pharmacist          |    50
 technician  | Pharmacy Technician |    30
 viewer      | Viewer              |    10
```

## Troubleshooting

### Connection Error

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

### Reset Everything

```bash
# Drop all tables and start fresh
cargo run -- fresh
```

### View Migration History

```sql
SELECT * FROM seaql_migrations ORDER BY version;
```

## Next Steps

After running migrations:

1. ✅ Verify schema created correctly
2. ✅ Test with sample data
3. ✅ Implement service layer
4. ✅ Build application features

## Quick Reference

| Command                | Action                       |
| ---------------------- | ---------------------------- |
| `cargo run -- up`      | Apply all pending migrations |
| `cargo run -- down`    | Rollback last migration      |
| `cargo run -- status`  | Check migration status       |
| `cargo run -- fresh`   | Drop all & recreate          |
| `cargo run -- refresh` | Rollback all & reapply       |

## Need Help?

- 📖 See [README.md](./README.md) for detailed documentation
- 📋 See [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) for complete overview
- 🗂️ See [../entity/ENTITY_MODEL.md](../entity/ENTITY_MODEL.md) for schema details
