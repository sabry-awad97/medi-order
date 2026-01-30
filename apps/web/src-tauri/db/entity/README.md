# Database Entity Layer

Professional entity models and DTOs for the pharmacy management system.

## Overview

This crate provides:

- **Entity Models**: SeaORM entity definitions for Staff and User
- **DTOs**: Data Transfer Objects for CRUD operations
- **ID Type**: Professional UUID v7-based ID implementation
- **Comprehensive Tests**: 54 passing tests covering all functionality

## Structure

```
db/entity/
├── src/
│   ├── id.rs              # UUID v7 ID type
│   ├── staff/
│   │   ├── mod.rs         # Staff entity model
│   │   └── dto.rs         # Staff DTOs
│   ├── user/
│   │   ├── mod.rs         # User entity model
│   │   └── dto.rs         # User DTOs
│   └── lib.rs             # Public API
├── tests/
│   ├── id_tests.rs        # ID type tests (17 tests)
│   ├── staff_tests.rs     # Staff entity tests (12 tests)
│   ├── user_tests.rs      # User entity tests (15 tests)
│   └── relationship_tests.rs # Relationship tests (10 tests)
├── ENTITY_MODEL.md        # Entity model documentation
├── DTO_GUIDE.md           # DTO usage guide
└── README.md              # This file
```

## Key Features

### Professional ID Type

- UUID v7 for time-ordered, globally unique identifiers
- Better database indexing performance than UUID v4
- Natural chronological ordering
- Stored as VARCHAR(36) in database

### Entity Model

- **Staff**: Base entity for all employees
- **User**: Authentication layer for staff with app access
- **Relationship**: One-to-one (Staff 1 ←→ 0..1 User)
- **Principle**: Every user IS a staff member, but not every staff member has a user account

### Comprehensive DTOs

#### Staff DTOs

- `CreateStaffDto` - Creating new staff members
- `UpdateStaffDto` - Updating staff information
- `StaffQueryDto` - Filtering staff queries
- `StaffResponseDto` - Staff data responses
- `StaffListDto` - Paginated staff lists
- `TerminateStaffDto` - Terminating staff members

#### User DTOs

- `CreateUserDto` - Granting app access
- `UpdateUserDto` - Updating user information
- `UserQueryDto` - Filtering user queries
- `UserResponseDto` - User data responses (excludes password hash)
- `UserWithStaffDto` - User with staff information
- `UserListDto` - Paginated user lists
- `LoginDto` - Authentication
- `LoginResponseDto` - Login response
- `ChangePasswordDto` - User password change
- `ResetPasswordDto` - Admin password reset

## Usage

### Import the prelude

```rust
use db_entity::prelude::*;
```

This imports:

- `Id` - The ID type
- `staff` - Staff entity module
- `staff_dto` - Staff DTOs
- `Staff` - Staff entity
- `user` - User entity module
- `user_dto` - User DTOs
- `User` - User entity

### Creating a Staff Member

```rust
use db_entity::prelude::*;
use db_entity::staff_dto::CreateStaffDto;

let dto = CreateStaffDto {
    full_name: "John Doe".to_string(),
    employee_id: "EMP001".to_string(),
    position: "Pharmacist".to_string(),
    department: "Pharmacy".to_string(),
    phone: "+1234567890".to_string(),
    email: "john@pharmacy.com".to_string(),
    employment_status: "active".to_string(),
    hire_date: Date::from_ymd_opt(2024, 1, 15).unwrap(),
    work_schedule: "full_time".to_string(),
    compensation: Some(Decimal::new(75000, 0)),
    emergency_contact_name: None,
    emergency_contact_phone: None,
    notes: None,
};
```

### Granting App Access

```rust
use db_entity::prelude::*;
use db_entity::user_dto::CreateUserDto;

let dto = CreateUserDto {
    staff_id: staff.id,
    username: "john.doe".to_string(),
    password: "SecurePassword123!".to_string(), // Will be hashed by service
    role: "pharmacist".to_string(),
    is_active: true,
};
```

### Querying Staff

```rust
use db_entity::prelude::*;
use db_entity::staff_dto::StaffQueryDto;

// Find all active pharmacists
let query = StaffQueryDto {
    employment_status: Some("active".to_string()),
    position: Some("Pharmacist".to_string()),
    ..Default::default()
};

// Search by name
let query = StaffQueryDto {
    search: Some("John".to_string()),
    ..Default::default()
};
```

## Testing

Run all tests:

```bash
cargo test --manifest-path apps/web/src-tauri/db/entity/Cargo.toml
```

Test coverage:

- **ID Tests**: 17 tests covering UUID v7 functionality
- **Staff Tests**: 12 tests covering staff entity operations
- **User Tests**: 15 tests covering user entity operations
- **Relationship Tests**: 10 tests covering staff-user relationships

All 54 tests pass successfully.

## Documentation

- **[ENTITY_MODEL.md](./ENTITY_MODEL.md)**: Detailed entity model documentation with use cases and database queries
- **[DTO_GUIDE.md](./DTO_GUIDE.md)**: Comprehensive guide to using DTOs in the service layer

## Best Practices

1. **Always use DTOs for API boundaries**: Never expose entity models directly
2. **Validate input**: Add validation logic in the service layer
3. **Hash passwords**: Always hash passwords before storage
4. **Exclude sensitive data**: Use response DTOs that exclude password hashes
5. **Use query DTOs**: Provide flexible filtering
6. **Pagination**: Always use list DTOs for large datasets
7. **Audit trail**: Preserve terminated staff and disabled users

## Security Considerations

- Plain passwords in DTOs are only for input; they must be hashed before storage
- Response DTOs never include password hashes
- Validate user roles against allowed values
- Enforce that every user must reference a valid staff member
- Use `is_active` flag instead of deleting user records

## Next Steps

The entity layer is complete and ready for the service layer implementation. The service layer will:

1. Implement CRUD operations using these DTOs
2. Add business logic and validation
3. Handle password hashing
4. Manage database transactions
5. Provide error handling

## Dependencies

- `sea-orm`: ORM for database operations
- `uuid`: UUID v7 generation
- `serde`: Serialization/deserialization
- `chrono`: Date and time handling
