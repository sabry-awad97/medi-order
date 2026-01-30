-- Seed admin user
WITH staff_insert AS (
    INSERT INTO staff (id, full_name, employee_id, position, department, phone, email, employment_status, hire_date, work_schedule)
    VALUES (gen_random_uuid(), 'Admin User', 'ADMIN001', 'Administrator', 'Administration', '555-0000', 'admin@pharmacy.com', 'active', CURRENT_DATE, 'full_time')
    ON CONFLICT (employee_id) DO UPDATE SET id = staff.id
    RETURNING id
),
role_select AS (
    SELECT id FROM roles WHERE name = 'admin' LIMIT 1
)
INSERT INTO users (id, staff_id, username, email, password_hash, first_name, last_name, role_id, status, is_active)
SELECT gen_random_uuid(), staff_insert.id, 'admin', 'admin@pharmacy.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqYqYqYqYq', 'Admin', 'User', role_select.id, 'active', true
FROM staff_insert, role_select
ON CONFLICT (username) DO NOTHING;
