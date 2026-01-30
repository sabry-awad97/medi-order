use db_entity::prelude::*;
use uuid::Uuid;

#[test]
fn test_id_creation() {
    let id1 = Id::new();
    let id2 = Id::new();

    // Each ID should be unique
    assert_ne!(id1, id2);
}

#[test]
fn test_id_from_uuid() {
    let uuid = Uuid::now_v7();
    let id = Id::from_uuid(uuid);

    assert_eq!(id.as_uuid(), &uuid);
    assert_eq!(id.into_uuid(), uuid);
}

#[test]
fn test_id_parsing() {
    let id = Id::new();
    let id_str = id.to_string();

    // Should parse successfully
    let parsed = Id::parse(&id_str).expect("Failed to parse ID");
    assert_eq!(id, parsed);
}

#[test]
fn test_id_parsing_invalid() {
    let result = Id::parse("invalid-uuid");
    assert!(result.is_err());
}

#[test]
fn test_id_display() {
    let id = Id::new();
    let display = format!("{}", id);

    // UUID format should be 36 characters with hyphens
    assert_eq!(display.len(), 36);
    assert!(display.contains('-'));
}

#[test]
fn test_id_ordering() {
    let id1 = Id::new();
    std::thread::sleep(std::time::Duration::from_millis(2));
    let id2 = Id::new();

    // UUID v7 should be time-ordered
    assert!(id1.is_before(&id2));
    assert!(id2.is_after(&id1));
    assert!(!id1.is_after(&id2));
    assert!(!id2.is_before(&id1));
}

#[test]
fn test_id_timestamp() {
    let id = Id::new();
    let timestamp = id.timestamp();

    assert!(timestamp.is_some());

    // Timestamp should be reasonable (not zero, not too far in future)
    let ts = timestamp.unwrap();
    assert!(ts > 0);
}

#[test]
fn test_id_default() {
    let id1 = Id::default();
    let id2 = Id::default();

    // Default should create new IDs
    assert_ne!(id1, id2);
}

#[test]
fn test_id_from_str() {
    let id = Id::new();
    let id_str = id.to_string();

    let parsed: Id = id_str.parse().expect("Failed to parse");
    assert_eq!(id, parsed);
}

#[test]
fn test_id_serialization() {
    let id = Id::new();

    // Serialize to JSON
    let json = serde_json::to_string(&id).expect("Failed to serialize");

    // Deserialize from JSON
    let deserialized: Id = serde_json::from_str(&json).expect("Failed to deserialize");

    assert_eq!(id, deserialized);
}

#[test]
fn test_id_hash() {
    use std::collections::HashSet;

    let id1 = Id::new();
    let id2 = Id::new();
    let id3 = id1; // Copy

    let mut set = HashSet::new();
    set.insert(id1);
    set.insert(id2);
    set.insert(id3);

    // Should have 2 unique IDs (id1 and id3 are the same)
    assert_eq!(set.len(), 2);
}

#[test]
fn test_id_clone() {
    let id1 = Id::new();
    let id2 = id1;

    assert_eq!(id1, id2);
}

#[test]
fn test_id_copy() {
    let id1 = Id::new();
    let id2 = id1; // Copy, not move

    // Both should still be usable
    assert_eq!(id1, id2);
    assert_eq!(id1.to_string(), id2.to_string());
}

#[test]
fn test_id_conversion_to_string() {
    let id = Id::new();
    let s: String = id.into();

    assert_eq!(s.len(), 36);
    assert!(s.contains('-'));
}

#[test]
fn test_id_conversion_from_uuid() {
    let uuid = Uuid::now_v7();
    let id: Id = uuid.into();
    let uuid2: Uuid = id.into();

    assert_eq!(uuid, uuid2);
}

#[test]
fn test_multiple_ids_are_unique() {
    let mut ids = Vec::new();
    for _ in 0..100 {
        ids.push(Id::new());
    }

    // All IDs should be unique
    for i in 0..ids.len() {
        for j in (i + 1)..ids.len() {
            assert_ne!(
                ids[i], ids[j],
                "IDs at positions {} and {} are not unique",
                i, j
            );
        }
    }
}

#[test]
fn test_id_ordering_consistency() {
    let mut ids = Vec::new();
    for _ in 0..10 {
        ids.push(Id::new());
        std::thread::sleep(std::time::Duration::from_millis(1));
    }

    // Each ID should be after all previous IDs
    for i in 0..ids.len() {
        for j in (i + 1)..ids.len() {
            assert!(ids[i].is_before(&ids[j]));
            assert!(ids[j].is_after(&ids[i]));
        }
    }
}
