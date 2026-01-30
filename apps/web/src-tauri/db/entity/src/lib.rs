//! Entity models for the pharmacy management system

pub mod id;
pub mod role;
pub mod staff;
pub mod user;

pub mod prelude {
    pub use super::id::Id;
    pub use super::role;
    pub use super::role::Entity as Role;
    pub use super::role::dto as role_dto;
    pub use super::staff;
    pub use super::staff::Entity as Staff;
    pub use super::staff::dto as staff_dto;
    pub use super::user;
    pub use super::user::Entity as User;
    pub use super::user::dto as user_dto;
}
