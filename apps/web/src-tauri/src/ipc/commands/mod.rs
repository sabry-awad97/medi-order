pub mod inventory;
pub mod onboarding;
pub mod settings;
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

pub use settings::{
    // CRUD operations
    delete_setting,
    delete_setting_by_id,
    // Category operations
    delete_setting_category,
    get_setting,
    // Typed getters
    get_setting_bool,
    get_setting_by_id,
    get_setting_categories,
    get_setting_number,
    get_setting_string,
    get_settings_by_category,
    // Statistics
    get_settings_statistics,
    list_settings,
    // Bulk operations
    set_multiple_settings,
    set_setting,
    // Existence checks
    setting_exists,
    update_setting,
};

pub use inventory::{
    // Stock management
    adjust_inventory_stock,
    // CRUD operations
    create_inventory_item,
    delete_inventory_item,
    get_inventory_item,
    get_inventory_item_by_barcode,
    // Statistics
    get_inventory_statistics,
    // Price history
    get_latest_price,
    // Listing & filtering
    get_low_stock_items,
    get_out_of_stock_items,
    get_price_history,
    get_price_statistics,
    list_active_inventory_items,
    restore_inventory_item,
    search_inventory_items,
    update_inventory_item,
    update_inventory_stock,
};
