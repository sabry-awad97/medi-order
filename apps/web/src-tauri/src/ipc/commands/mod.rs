pub mod onboarding;
pub mod user;

pub use user::{
    // Authentication & Security
    change_password,
    // CRUD operations
    create_user,
    delete_user,
    // User Management
    delete_user_permanently,
    // User Retrieval
    get_active_users,
    get_user,
    get_user_by_staff_id,
    get_user_by_username,
    // Statistics
    get_user_statistics,
    get_user_with_staff,
    list_users,
    login_user,
    reset_password,
    restore_user,
    update_user,
};

pub use onboarding::{check_first_run, complete_first_run_setup, complete_first_run_setup_default};
