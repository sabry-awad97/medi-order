-- ═══════════════════════════════════════════════════════════════════════════════
--  Database Initialization
-- ═══════════════════════════════════════════════════════════════════════════════
--  Sets up database configuration and helper functions
-- ═══════════════════════════════════════════════════════════════════════════════

-- Set timezone to UTC
SET timezone = 'UTC';

-- Create helper function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create helper function for soft delete
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database helper functions created successfully';
END $$;
