use argon2::password_hash::SaltString;
use argon2::{Argon2, PasswordHasher};
use chrono::{Duration, Utc};
use db_entity::id::Id;
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use thiserror::Error;

/// JWT Claims structure for authentication tokens
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: String,
    /// User email
    pub email: String,
    /// User role
    pub role: String,
    /// Issued at timestamp
    pub iat: i64,
    /// Expiration timestamp
    pub exp: i64,
    /// Not before timestamp
    pub nbf: i64,
    /// JWT ID (unique token identifier)
    pub jti: String,
    /// Issuer
    pub iss: String,
    /// Audience
    pub aud: String,
}

/// JWT Error types
#[derive(Debug, Error)]
pub enum JwtError {
    #[error("JWT encoding error: {0}")]
    EncodingError(#[from] jsonwebtoken::errors::Error),

    #[error("Token has expired")]
    Expired,

    #[error("Token not yet valid")]
    NotYetValid,

    #[error("Invalid token")]
    Invalid,

    #[error("Argon2 error: {0}")]
    Argon2Error(String),
}

/// JWT Service for creating and validating tokens
/// Uses jsonwebtoken crate with Argon2-derived keys for enhanced security
pub struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    validation: Validation,
    issuer: String,
    audience: String,
    expiration_hours: i64,
}

impl std::fmt::Debug for JwtService {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("JwtService")
            .field("issuer", &self.issuer)
            .field("audience", &self.audience)
            .field("expiration_hours", &self.expiration_hours)
            .finish()
    }
}

impl JwtService {
    /// Create a new JWT service with Argon2-derived key
    ///
    /// The secret is hashed using Argon2 to create a strong, fixed-length key
    /// suitable for HMAC signing. This provides additional security over using
    /// the raw secret directly.
    pub fn new(
        secret: String,
        issuer: String,
        audience: String,
        expiration_hours: i64,
    ) -> Result<Self, JwtError> {
        // Derive a strong key from the secret using Argon2
        let derived_key = Self::derive_key(&secret)?;

        let encoding_key = EncodingKey::from_secret(&derived_key);
        let decoding_key = DecodingKey::from_secret(&derived_key);

        let mut validation = Validation::new(Algorithm::HS256);
        validation.set_issuer(&[&issuer]);
        validation.set_audience(&[&audience]);
        validation.validate_exp = true;
        validation.validate_nbf = true;

        Ok(Self {
            encoding_key,
            decoding_key,
            validation,
            issuer,
            audience,
            expiration_hours,
        })
    }

    /// Derive a cryptographically strong key from the secret using Argon2
    fn derive_key(secret: &str) -> Result<Vec<u8>, JwtError> {
        let argon2 = Argon2::default();

        // Use a fixed salt derived from a constant for deterministic key derivation
        let salt_bytes = Self::derive_salt(secret);
        let salt = SaltString::encode_b64(&salt_bytes)
            .map_err(|e| JwtError::Argon2Error(e.to_string()))?;

        // Hash the secret to create a strong key
        let password_hash = argon2
            .hash_password(secret.as_bytes(), &salt)
            .map_err(|e| JwtError::Argon2Error(e.to_string()))?;

        // Extract the hash bytes (32 bytes for HS256)
        let hash = password_hash
            .hash
            .ok_or_else(|| JwtError::Argon2Error("No hash generated".to_string()))?;

        Ok(hash.as_bytes().to_vec())
    }

    /// Derive a deterministic salt from the secret
    fn derive_salt(secret: &str) -> [u8; 16] {
        let mut salt = [0u8; 16];
        let secret_bytes = secret.as_bytes();

        // XOR secret bytes into salt for deterministic derivation
        for (i, byte) in secret_bytes.iter().enumerate() {
            salt[i % 16] ^= byte;
        }

        // Add some additional mixing using iterator
        for (i, item) in salt.iter_mut().enumerate() {
            *item = item.wrapping_add((i as u8).wrapping_mul(17));
        }

        salt
    }

    /// Generate a JWT token for a user
    pub fn generate_token(
        &self,
        user_id: Id,
        email: String,
        role: String,
    ) -> Result<String, JwtError> {
        let now = Utc::now();
        let exp = now + Duration::hours(self.expiration_hours);

        let claims = Claims {
            sub: user_id.to_string(),
            email,
            role,
            iat: now.timestamp(),
            exp: exp.timestamp(),
            nbf: now.timestamp(),
            jti: Id::new().to_string(),
            iss: self.issuer.clone(),
            aud: self.audience.clone(),
        };

        let token = encode(&Header::default(), &claims, &self.encoding_key)?;
        Ok(token)
    }

    /// Verify and decode a JWT token
    pub fn verify_token(&self, token: &str) -> Result<Claims, JwtError> {
        let token_data =
            decode::<Claims>(token, &self.decoding_key, &self.validation).map_err(|e| {
                match e.kind() {
                    jsonwebtoken::errors::ErrorKind::ExpiredSignature => JwtError::Expired,
                    jsonwebtoken::errors::ErrorKind::ImmatureSignature => JwtError::NotYetValid,
                    _ => JwtError::Invalid,
                }
            })?;

        Ok(token_data.claims)
    }

    /// Refresh a token (generate new token with same user info but new timestamps)
    pub fn refresh_token(&self, token: &str) -> Result<String, JwtError> {
        let claims = self.verify_token(token)?;

        // Parse the user_id back from string
        let user_id = claims.sub.parse::<Id>().map_err(|_| JwtError::Invalid)?;

        self.generate_token(user_id, claims.email, claims.role)
    }

    /// Extract claims without verification (useful for debugging, not for auth)
    pub fn decode_without_verification(&self, token: &str) -> Result<Claims, JwtError> {
        let mut validation = Validation::new(Algorithm::HS256);
        validation.insecure_disable_signature_validation();
        validation.validate_exp = false;
        validation.validate_nbf = false;
        validation.validate_aud = false;

        let token_data = decode::<Claims>(token, &self.decoding_key, &validation)?;
        Ok(token_data.claims)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_service() -> JwtService {
        JwtService::new(
            "test_secret_key_12345".to_string(),
            "meditrack".to_string(),
            "meditrack-app".to_string(),
            24,
        )
        .expect("Failed to create JWT service")
    }

    #[test]
    fn test_generate_and_verify_token() {
        let service = create_test_service();
        let user_id = Id::new();
        let email = "test@example.com".to_string();
        let role = "admin".to_string();

        let token = service
            .generate_token(user_id, email.clone(), role.clone())
            .expect("Failed to generate token");

        let claims = service
            .verify_token(&token)
            .expect("Failed to verify token");

        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.email, email);
        assert_eq!(claims.role, role);
        assert_eq!(claims.iss, "meditrack");
        assert_eq!(claims.aud, "meditrack-app");
    }

    #[test]
    fn test_invalid_token() {
        let service = create_test_service();
        let result = service.verify_token("invalid.token.here");
        assert!(result.is_err());
    }

    #[test]
    fn test_tampered_token() {
        let service = create_test_service();
        let user_id = Id::new();
        let token = service
            .generate_token(user_id, "test@example.com".to_string(), "admin".to_string())
            .expect("Failed to generate token");

        // Tamper with the token
        let mut parts: Vec<&str> = token.split('.').collect();
        parts[1] = "eyJzdWIiOiJ0YW1wZXJlZCJ9"; // tampered payload
        let tampered_token = parts.join(".");

        let result = service.verify_token(&tampered_token);
        assert!(result.is_err());
    }

    #[test]
    fn test_refresh_token() {
        let service = create_test_service();
        let user_id = Id::new();
        let email = "test@example.com".to_string();
        let role = "admin".to_string();

        let token = service
            .generate_token(user_id, email.clone(), role.clone())
            .expect("Failed to generate token");

        // Wait a moment to ensure different timestamps
        std::thread::sleep(std::time::Duration::from_millis(10));

        let refreshed_token = service
            .refresh_token(&token)
            .expect("Failed to refresh token");

        assert_ne!(token, refreshed_token);

        let claims = service
            .verify_token(&refreshed_token)
            .expect("Failed to verify refreshed token");

        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.email, email);
        assert_eq!(claims.role, role);
    }

    #[test]
    fn test_deterministic_key_derivation() {
        let secret = "test_secret";
        let key1 = JwtService::derive_key(secret).expect("Failed to derive key");
        let key2 = JwtService::derive_key(secret).expect("Failed to derive key");

        assert_eq!(key1, key2, "Key derivation should be deterministic");
    }

    #[test]
    fn test_decode_without_verification() {
        let service = create_test_service();
        let user_id = Id::new();
        let email = "test@example.com".to_string();

        let token = service
            .generate_token(user_id, email.clone(), "admin".to_string())
            .expect("Failed to generate token");

        let claims = service
            .decode_without_verification(&token)
            .expect("Failed to decode token");

        assert_eq!(claims.email, email);
    }

    #[test]
    fn test_different_secrets_produce_different_keys() {
        let key1 = JwtService::derive_key("secret1").expect("Failed to derive key");
        let key2 = JwtService::derive_key("secret2").expect("Failed to derive key");

        assert_ne!(
            key1, key2,
            "Different secrets should produce different keys"
        );
    }
}
