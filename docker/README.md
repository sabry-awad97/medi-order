# MediTrack Docker Setup

## Overview

Professional Docker Compose setup for MediTrack development environment with PostgreSQL 18 + pgvector + pg_textsearch.

**Project Name:** `meditrack` (used for container and volume naming)

## Services

### PostgreSQL 18 with pgvector and pg_textsearch

- **Image**: Custom built from `pgvector/pgvector:pg18-trixie`
- **Port**: 5432
- **Database**: meditrack
- **User**: meditrack
- **Password**: meditrack_dev_password
- **Extensions**: pgvector, pg_textsearch, uuid-ossp, pgcrypto, pg_trgm, btree_gin, pg_stat_statements

### pgAdmin (Optional)

- **Port**: 5050
- **Email**: admin@meditrack.local
- **Password**: admin

### Redis (Optional)

- **Port**: 6379
- **Password**: meditrack_redis_password

## Quick Start

### 1. Build Custom PostgreSQL Image

```bash
task docker:build
```

This builds a custom PostgreSQL 18 image with pgvector and pg_textsearch extensions.

### 2. Start Database

```bash
task docker:db:start
```

### 3. Run Migrations

```bash
task db:migrate
```

### 4. Verify Setup

```bash
task db:test:all
```

## Alternative: Manual Docker Commands

If you prefer not to use Task commands, you can use Docker Compose directly:

### 1. Copy Environment File

```bash
cp .env.example .env
```

### 2. Start Database

```bash
# Start PostgreSQL only
docker-compose up -d postgres

# Or use task command (recommended)
task docker:db:start
```

### 3. Verify Database

```bash
# Check if database is running
docker-compose ps

# Or use task command
task docker:ps

# Check logs
docker-compose logs postgres

# Or use task command
task docker:db:logs

# Connect to database
docker-compose exec postgres psql -U meditrack -d meditrack

# Or use task command
task docker:db:shell
```

### 4. Run Migrations

```bash
# Using task (recommended - automatically sets DATABASE_URL)
task db:migrate

# Or manually (Windows CMD)
set DATABASE_URL=postgresql://meditrack:meditrack_dev_password@localhost:5432/meditrack
cd apps\web\src-tauri\db\migration
cargo run -- up

# Or manually (PowerShell)
$env:DATABASE_URL="postgresql://meditrack:meditrack_dev_password@localhost:5432/meditrack"
cd apps\web\src-tauri\db\migration
cargo run -- up
```

## Docker Commands

### Build Custom Image

```bash
# Build PostgreSQL image with extensions
task docker:build

# Or manually
docker-compose build postgres
```

### Start Services

```bash
# Start all services
task docker:up
# Or: docker-compose up -d

# Start specific service
task docker:db:start
# Or: docker-compose up -d postgres

# Start with pgAdmin
task docker:pgadmin:start
# Or: docker-compose --profile admin up -d

# Start with Redis
task docker:redis:start
# Or: docker-compose --profile cache up -d
```

### Stop Services

```bash
# Stop all services
task docker:down
# Or: docker-compose down

# Stop specific service
task docker:db:stop
# Or: docker-compose stop postgres

# Stop and remove volumes (DESTRUCTIVE)
docker-compose down -v
```

### View Logs

```bash
# All services
task docker:logs
# Or: docker-compose logs -f

# Specific service
task docker:db:logs
# Or: docker-compose logs -f postgres
```

### Database Operations

```bash
# Connect to PostgreSQL
task docker:db:shell
# Or: docker-compose exec postgres psql -U meditrack -d meditrack

# Run SQL command
task db:verify
# Or: docker-compose exec -T postgres psql -U meditrack -d meditrack -c "\dt"

# Backup database
task db:backup
# Or: docker-compose exec -T postgres pg_dump -U meditrack meditrack > backup.sql

# Restore database
task db:restore BACKUP_FILE=backup.sql
# Or: docker-compose exec -T postgres psql -U meditrack -d meditrack < backup.sql

# Reset database (DESTRUCTIVE)
task docker:db:reset
```

## Extensions Enabled

- ✅ **uuid-ossp** - UUID generation
- ✅ **pgcrypto** - Password hashing
- ✅ **pg_stat_statements** - Query performance monitoring
- ✅ **pg_trgm** - Fuzzy text search
- ✅ **btree_gin** - Composite indexes
- ✅ **vector** - pgvector for AI/ML similarity search
- ✅ **pg_textsearch** - Advanced full-text search (Timescale)

## Verify Extensions

```bash
# List all extensions
task db:test:connection

# Or manually
docker-compose exec postgres psql -U meditrack -d meditrack -c "SELECT * FROM pg_extension;"

# Check pgvector
docker-compose exec postgres psql -U meditrack -d meditrack -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

# Check pg_textsearch
docker-compose exec postgres psql -U meditrack -d meditrack -c "SELECT * FROM pg_extension WHERE extname = 'pg_textsearch';"
```

## Task Commands (Recommended)

MediTrack includes a comprehensive Taskfile with 50+ commands for database management. All commands automatically use Docker - no local PostgreSQL installation required!

### Database Management

```bash
# Migrations
task db:migrate              # Apply all pending migrations
task db:migrate:status       # Check migration status
task db:migrate:rollback     # Rollback last migration
task db:migrate:reset        # Rollback all migrations

# Testing
task db:test:all            # Run all database tests
task db:test:connection     # Test database connection
task db:test:enums          # Test ENUM types
task db:test:tables         # Test tables exist
task db:test:indexes        # Test indexes exist
task db:test:triggers       # Test triggers exist
task db:test:foreign-keys   # Test foreign keys exist

# Information
task db:verify              # Verify database schema
task db:roles               # List default roles
task db:info                # Show database information
task db:size                # Show database size
task db:stats               # Show database statistics

# Maintenance
task db:vacuum              # Vacuum database
task db:backup              # Backup database to file
task db:restore             # Restore database from backup

# Seeding
task db:seed:staff          # Seed sample staff data
task db:seed:test-user      # Seed test admin user
task db:seed:all            # Seed all sample data
```

### Docker Management

```bash
# Build & Start
task docker:build           # Build custom PostgreSQL image
task docker:up              # Start all services
task docker:down            # Stop all services

# Database
task docker:db:start        # Start PostgreSQL
task docker:db:stop         # Stop PostgreSQL
task docker:db:restart      # Restart PostgreSQL
task docker:db:logs         # View PostgreSQL logs
task docker:db:shell        # Open psql shell
task docker:db:reset        # Reset database (DESTRUCTIVE)

# pgAdmin
task docker:pgadmin:start   # Start pgAdmin
task docker:pgadmin:stop    # Stop pgAdmin
task docker:pgadmin:logs    # View pgAdmin logs

# Redis
task docker:redis:start     # Start Redis
task docker:redis:stop      # Stop Redis
task docker:redis:cli       # Open Redis CLI
task docker:redis:logs      # View Redis logs

# Status
task docker:ps              # Show service status
task docker:logs            # View all logs
```

## pgAdmin Access

1. Start with admin profile:

   ```bash
   task docker:pgadmin:start
   # Or manually: docker-compose --profile admin up -d
   ```

2. Open browser: http://localhost:5050

3. Login:
   - Email: admin@meditrack.local
   - Password: admin

4. Server is pre-configured as "MediTrack Database"

## Redis Access

1. Start with cache profile:

   ```bash
   task docker:redis:start
   # Or manually: docker-compose --profile cache up -d
   ```

2. Connect:
   ```bash
   task docker:redis:cli
   # Or manually: docker-compose exec redis redis-cli -a meditrack_redis_password
   ```

## Volume Management

### List Volumes

```bash
# List all volumes
docker volume ls

# Filter MediTrack volumes
docker volume ls | findstr meditrack  # Windows
docker volume ls | grep meditrack     # Linux/Mac
```

### Backup Volume

**Windows PowerShell:**

```powershell
docker run --rm -v medi-order_postgres_data:/data -v ${PWD}:/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

**Linux/Mac:**

```bash
docker run --rm -v medi-order_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

### Restore Volume

**Windows PowerShell:**

```powershell
docker run --rm -v medi-order_postgres_data:/data -v ${PWD}:/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

**Linux/Mac:**

```bash
docker run --rm -v medi-order_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

### Remove Volumes (DESTRUCTIVE)

```bash
docker-compose down -v
```

## Configuration Files

### PostgreSQL Configuration

- `docker/postgres/postgresql.conf` - PostgreSQL settings
- `docker/postgres/init/01-init-extensions.sql` - Extension initialization
- `docker/postgres/init/02-init-database.sql` - Database setup

### pgAdmin Configuration

- `docker/pgadmin/servers.json` - Pre-configured server connection

## Troubleshooting

### Database Won't Start

```bash
# Check logs
docker-compose logs postgres
# Or: task docker:db:logs

# Remove and recreate
docker-compose down -v
docker-compose up -d postgres
# Or: task docker:db:reset
```

### Connection Refused

```bash
# Check if container is running
docker-compose ps
# Or: task docker:ps

# Check if port is available (Windows)
netstat -an | findstr :5432

# Check if port is available (Linux/Mac)
netstat -an | grep 5432

# Test connection
task db:test:connection
# Or: docker-compose exec postgres psql -U meditrack -d meditrack -c "SELECT 1;"
```

### Permission Issues (Linux/Mac)

```bash
# Fix volume permissions
docker-compose down
sudo chown -R $(id -u):$(id -g) docker/postgres/backups
docker-compose up -d
```

**Note:** Windows users typically don't encounter permission issues with Docker volumes.

### Reset Everything

```bash
# Stop and remove everything
docker-compose down -v
# Or: task docker:down

# Remove all MediTrack volumes (Windows PowerShell)
docker volume ls -q | Select-String "meditrack" | ForEach-Object { docker volume rm $_ }

# Remove all MediTrack volumes (Linux/Mac)
docker volume rm $(docker volume ls -q | grep meditrack)

# Start fresh
docker-compose up -d
# Or: task docker:up
```

## Production Considerations

⚠️ **This setup is for DEVELOPMENT only!**

For production:

1. **Change all passwords** in `.env`
2. **Enable SSL** in PostgreSQL
3. **Use secrets management** (Docker secrets, Vault)
4. **Configure backups** (automated pg_dump)
5. **Set resource limits** in docker-compose.yml
6. **Use external volumes** for data persistence
7. **Enable monitoring** (Prometheus, Grafana)
8. **Configure firewall** rules
9. **Use reverse proxy** (Nginx, Traefik)
10. **Enable audit logging**

## Health Checks

All services include health checks:

```bash
# Check health status
docker-compose ps
# Or: task docker:ps

# View health check logs (Windows)
docker inspect meditrack-db | findstr Health

# View health check logs (Linux/Mac)
docker inspect meditrack-db | grep -A 10 Health
```

## Windows-Specific Notes

### Path Separators

- Use backslashes `\` for Windows paths in commands
- Task commands handle paths automatically

### Environment Variables

```cmd
# CMD
set DATABASE_URL=postgresql://meditrack:meditrack_dev_password@localhost:5432/meditrack

# PowerShell
$env:DATABASE_URL="postgresql://meditrack:meditrack_dev_password@localhost:5432/meditrack"
```

### Docker Desktop

- Ensure Docker Desktop is running before executing commands
- WSL2 backend is recommended for better performance
- File sharing must be enabled for the project directory

### Line Endings

- Git may convert line endings (LF to CRLF)
- This can cause issues with shell scripts in containers
- Configure Git: `git config --global core.autocrlf input`

## Performance Tuning

### PostgreSQL Settings

Edit `docker/postgres/postgresql.conf`:

```conf
# For development (default)
shared_buffers = 256MB
effective_cache_size = 1GB

# For production (adjust based on RAM)
shared_buffers = 4GB
effective_cache_size = 12GB
```

### Resource Limits

Add to docker-compose.yml:

```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 4G
        reservations:
          cpus: "1"
          memory: 2G
```

## Monitoring

### Query Statistics

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Database Size

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('meditrack'));

-- Table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Backup Strategy

### Automated Backups

Create a scheduled task (Windows) or cron job (Linux/Mac):

**Windows Task Scheduler:**

```powershell
# Create a PowerShell script: backup-meditrack.ps1
$date = Get-Date -Format "yyyyMMdd_HHmmss"
docker-compose exec -T postgres pg_dump -U meditrack meditrack | Out-File -FilePath "backups\meditrack_$date.sql"
```

**Linux/Mac Cron:**

```bash
# Add to crontab
0 2 * * * cd /path/to/meditrack && docker-compose exec -T postgres pg_dump -U meditrack meditrack | gzip > docker/postgres/backups/meditrack_$(date +\%Y\%m\%d).sql.gz
```

### Manual Backup

```bash
# Full backup
task db:backup
# Or: docker-compose exec -T postgres pg_dump -U meditrack meditrack > backup_$(date +%Y%m%d).sql

# Compressed backup
docker-compose exec -T postgres pg_dump -U meditrack meditrack | gzip > backup_$(date +%Y%m%d).sql.gz

# Schema only
docker-compose exec -T postgres pg_dump -U meditrack -s meditrack > schema_$(date +%Y%m%d).sql

# Restore from backup
task db:restore BACKUP_FILE=backup.sql
# Or: docker-compose exec -T postgres psql -U meditrack -d meditrack < backup.sql
```

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/18/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
