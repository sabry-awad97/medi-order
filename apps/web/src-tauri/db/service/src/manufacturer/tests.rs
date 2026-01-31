use db_entity::manufacturer::dto::*;
use sea_orm::{DatabaseBackend, MockDatabase};

use super::*;

#[tokio::test]
async fn test_create_manufacturer() {
    // Create mock database
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([
            // exists_by_name count query - returns 0 (doesn't exist)
            vec![maplit::btreemap! {
                "num_items" => sea_orm::Value::BigInt(Some(0)),
            }],
        ])
        .append_exec_results([sea_orm::MockExecResult {
            last_insert_id: 1,
            rows_affected: 1,
        }])
        .append_query_results([
            // Query result after insert (for returning clause)
            vec![db_entity::manufacturer::Model {
                id: uuid::Uuid::now_v7().into(),
                name: "Test Manufacturer".to_string(),
                short_name: Some("TM".to_string()),
                country: Some("USA".to_string()),
                phone: None,
                email: None,
                website: None,
                notes: None,
                is_active: true,
                created_at: chrono::Utc::now().into(),
                updated_at: chrono::Utc::now().into(),
            }],
        ])
        .into_connection();

    let service = ManufacturerService::new(Arc::new(db));

    let create_data = CreateManufacturer {
        name: "Test Manufacturer".to_string(),
        short_name: Some("TM".to_string()),
        country: Some("USA".to_string()),
        phone: None,
        email: None,
        website: None,
        notes: None,
    };

    let result = service.create(create_data).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_create_manufacturer_duplicate_name() {
    // Create mock database - name already exists
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([
            // exists_by_name count query - returns 1 (already exists)
            vec![maplit::btreemap! {
                "num_items" => sea_orm::Value::BigInt(Some(1)),
            }],
        ])
        .into_connection();

    let service = ManufacturerService::new(Arc::new(db));

    let create_data = CreateManufacturer {
        name: "Existing Manufacturer".to_string(),
        short_name: Some("EM".to_string()),
        country: Some("USA".to_string()),
        phone: None,
        email: None,
        website: None,
        notes: None,
    };

    let result = service.create(create_data).await;
    assert!(result.is_err());

    // Verify it's a Conflict error
    match result {
        Err(ServiceError::Conflict(msg)) => {
            assert!(msg.contains("Existing Manufacturer"));
            assert!(msg.contains("already exists"));
        }
        _ => panic!("Expected Conflict error"),
    }
}

#[tokio::test]
async fn test_create_bulk_manufacturers() {
    // Create mock database - insert_many with exec, then query to fetch results
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_exec_results([
            // insert_many exec result
            sea_orm::MockExecResult {
                last_insert_id: 1,
                rows_affected: 3,
            },
        ])
        .append_query_results([
            // Query to fetch inserted records
            vec![
                db_entity::manufacturer::Model {
                    id: uuid::Uuid::now_v7().into(),
                    name: "Manufacturer 1".to_string(),
                    short_name: Some("M1".to_string()),
                    country: Some("USA".to_string()),
                    phone: None,
                    email: None,
                    website: None,
                    notes: None,
                    is_active: true,
                    created_at: chrono::Utc::now().into(),
                    updated_at: chrono::Utc::now().into(),
                },
                db_entity::manufacturer::Model {
                    id: uuid::Uuid::now_v7().into(),
                    name: "Manufacturer 2".to_string(),
                    short_name: Some("M2".to_string()),
                    country: Some("USA".to_string()),
                    phone: None,
                    email: None,
                    website: None,
                    notes: None,
                    is_active: true,
                    created_at: chrono::Utc::now().into(),
                    updated_at: chrono::Utc::now().into(),
                },
                db_entity::manufacturer::Model {
                    id: uuid::Uuid::now_v7().into(),
                    name: "Manufacturer 3".to_string(),
                    short_name: Some("M3".to_string()),
                    country: Some("USA".to_string()),
                    phone: None,
                    email: None,
                    website: None,
                    notes: None,
                    is_active: true,
                    created_at: chrono::Utc::now().into(),
                    updated_at: chrono::Utc::now().into(),
                },
            ],
        ])
        .into_connection();

    let service = ManufacturerService::new(Arc::new(db));

    let manufacturers = vec![
        CreateManufacturer {
            name: "Manufacturer 1".to_string(),
            short_name: Some("M1".to_string()),
            country: Some("USA".to_string()),
            phone: None,
            email: None,
            website: None,
            notes: None,
        },
        CreateManufacturer {
            name: "Manufacturer 2".to_string(),
            short_name: Some("M2".to_string()),
            country: Some("USA".to_string()),
            phone: None,
            email: None,
            website: None,
            notes: None,
        },
        CreateManufacturer {
            name: "Manufacturer 3".to_string(),
            short_name: Some("M3".to_string()),
            country: Some("USA".to_string()),
            phone: None,
            email: None,
            website: None,
            notes: None,
        },
    ];

    let result = service.create_bulk(manufacturers).await;
    assert!(result.is_ok());
    let created = result.unwrap();
    assert_eq!(created.len(), 3);
}

#[tokio::test]
async fn test_list_manufacturers() {
    let now = chrono::Utc::now().into();

    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([vec![
            db_entity::manufacturer::Model {
                id: uuid::Uuid::now_v7().into(),
                name: "Manufacturer 1".to_string(),
                short_name: Some("M1".to_string()),
                country: Some("USA".to_string()),
                phone: None,
                email: None,
                website: None,
                notes: None,
                is_active: true,
                created_at: now,
                updated_at: now,
            },
            db_entity::manufacturer::Model {
                id: uuid::Uuid::now_v7().into(),
                name: "Manufacturer 2".to_string(),
                short_name: Some("M2".to_string()),
                country: Some("Canada".to_string()),
                phone: None,
                email: None,
                website: None,
                notes: None,
                is_active: true,
                created_at: now,
                updated_at: now,
            },
        ]])
        .into_connection();

    let service = ManufacturerService::new(Arc::new(db));

    let result = service.list(false).await;
    assert!(result.is_ok());
    let manufacturers = result.unwrap();
    assert_eq!(manufacturers.len(), 2);
}

#[tokio::test]
async fn test_list_active_manufacturers() {
    let now = chrono::Utc::now().into();

    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([vec![db_entity::manufacturer::Model {
            id: uuid::Uuid::now_v7().into(),
            name: "Active Manufacturer".to_string(),
            short_name: Some("AM".to_string()),
            country: Some("USA".to_string()),
            phone: None,
            email: None,
            website: None,
            notes: None,
            is_active: true,
            created_at: now,
            updated_at: now,
        }]])
        .into_connection();

    let service = ManufacturerService::new(Arc::new(db));

    let result = service.list_active().await;
    assert!(result.is_ok());
    let manufacturers = result.unwrap();
    assert_eq!(manufacturers.len(), 1);
    assert!(manufacturers[0].is_active);
}

#[tokio::test]
async fn test_get_manufacturer_by_id() {
    let id = uuid::Uuid::now_v7().into();
    let now = chrono::Utc::now().into();

    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([vec![db_entity::manufacturer::Model {
            id,
            name: "Test Manufacturer".to_string(),
            short_name: Some("TM".to_string()),
            country: Some("USA".to_string()),
            phone: None,
            email: None,
            website: None,
            notes: None,
            is_active: true,
            created_at: now,
            updated_at: now,
        }]])
        .into_connection();

    let service = ManufacturerService::new(Arc::new(db));

    let result = service.get_by_id(id).await;
    assert!(result.is_ok());
    let manufacturer = result.unwrap();
    assert_eq!(manufacturer.id, id);
    assert_eq!(manufacturer.name, "Test Manufacturer");
}

#[tokio::test]
async fn test_get_manufacturer_by_name() {
    let now = chrono::Utc::now().into();

    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([vec![db_entity::manufacturer::Model {
            id: uuid::Uuid::now_v7().into(),
            name: "Test Manufacturer".to_string(),
            short_name: Some("TM".to_string()),
            country: Some("USA".to_string()),
            phone: None,
            email: None,
            website: None,
            notes: None,
            is_active: true,
            created_at: now,
            updated_at: now,
        }]])
        .into_connection();

    let service = ManufacturerService::new(Arc::new(db));

    let result = service.get_by_name("Test Manufacturer").await;
    assert!(result.is_ok());
    let manufacturer = result.unwrap();
    assert_eq!(manufacturer.name, "Test Manufacturer");
}

#[tokio::test]
async fn test_exists_by_name() {
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([
            // count query returns 1 (exists)
            vec![maplit::btreemap! {
                "num_items" => sea_orm::Value::BigInt(Some(1)),
            }],
        ])
        .into_connection();

    let service = ManufacturerService::new(Arc::new(db));

    let result = service.exists_by_name("Existing Manufacturer").await;
    assert!(result.is_ok());
    assert!(result.unwrap());
}
