use crate::{Result, SeederError};
use db_entity::medicine_form::dto::CreateMedicineForm;
use db_service::ServiceManager;
use serde::Deserialize;
use std::sync::Arc;

/// Medicine form data structure from JSON
#[derive(Debug, Deserialize)]
struct MedicineFormJson {
    name_en: String,
    name_ar: String,
    #[serde(default)]
    #[allow(dead_code)]
    category: Option<String>,
}

/// Load medicine forms data from JSON file at compile time
const MEDICINE_FORMS_JSON: &str = include_str!("../data/medicine_forms.json");

/// Parse medicine forms from JSON
fn load_medicine_forms() -> Result<Vec<MedicineFormJson>> {
    serde_json::from_str(MEDICINE_FORMS_JSON).map_err(|e| {
        SeederError::DataGeneration(format!("Failed to parse medicine forms JSON: {}", e))
    })
}

/// Generate a code from the English name
fn generate_code(name_en: &str) -> String {
    name_en
        .to_uppercase()
        .replace(" ", "_")
        .replace("/", "_")
        .replace("-", "_")
        .replace("(", "")
        .replace(")", "")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_')
        .collect()
}

pub async fn seed(service_manager: &Arc<ServiceManager>) -> Result<()> {
    // Load medicine forms from JSON
    let medicine_forms = load_medicine_forms()?;

    for (index, form_data) in medicine_forms.iter().enumerate() {
        let code = generate_code(&form_data.name_en);

        // Check if form already exists using the service manager's getter
        if service_manager
            .medicine_forms()
            .exists_by_code(&code)
            .await
            .unwrap_or(false)
        {
            continue;
        }

        let create_dto = CreateMedicineForm {
            code: code.clone(),
            name_en: form_data.name_en.clone(),
            name_ar: form_data.name_ar.clone(),
            display_order: (index + 1) as i32,
        };

        service_manager
            .medicine_forms()
            .create(create_dto)
            .await
            .map_err(|e| {
                SeederError::SeedingFailed(format!(
                    "Failed to seed medicine form '{}': {}",
                    code, e
                ))
            })?;
    }

    Ok(())
}
