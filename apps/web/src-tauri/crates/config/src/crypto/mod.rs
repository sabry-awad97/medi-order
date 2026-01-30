//! Cryptographic utilities for secure configuration storage

use crate::error::{ConfigError, Result};
use aes_gcm::{
    Aes256Gcm, KeyInit, Nonce,
    aead::{Aead, OsRng},
};
use argon2::{
    Argon2,
    password_hash::{PasswordHasher, SaltString, rand_core::RngCore},
};
use base64::{Engine as _, engine::general_purpose};

/// Secure storage for configuration encryption
#[derive(Clone)]
pub struct SecureStorage {
    key: [u8; 32],
}

impl SecureStorage {
    /// Create a new secure storage with a derived key
    ///
    /// that configurations are tied to the specific machine.
    pub fn new() -> Result<Self> {
        let machine_id = Self::get_machine_id()?;
        let key = Self::derive_key(&machine_id)?;
        Ok(Self { key })
    }

    /// Encrypt data
    pub fn encrypt(&self, plaintext: &str) -> Result<String> {
        // Generate a random nonce
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        // Create cipher from key
        let cipher = Aes256Gcm::new(&self.key.into());

        // Encrypt the data
        let ciphertext = cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| ConfigError::Encryption(e.to_string()))?;

        // Combine nonce and ciphertext
        let mut result = nonce_bytes.to_vec();
        result.extend_from_slice(&ciphertext);

        // Encode as base64
        Ok(general_purpose::STANDARD.encode(result))
    }

    /// Decrypt data
    pub fn decrypt(&self, ciphertext: &str) -> Result<String> {
        // Decode from base64
        let data = general_purpose::STANDARD
            .decode(ciphertext)
            .map_err(|e| ConfigError::Decryption(e.to_string()))?;

        // Split nonce and ciphertext
        if data.len() < 12 {
            return Err(ConfigError::Decryption(
                "Invalid ciphertext: too short".to_string(),
            ));
        }

        let (nonce_bytes, ciphertext_bytes) = data.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);

        // Create cipher from key
        let cipher = Aes256Gcm::new(&self.key.into());

        // Decrypt the data
        let plaintext = cipher
            .decrypt(nonce, ciphertext_bytes)
            .map_err(|e| ConfigError::Decryption(e.to_string()))?;

        // Convert to string
        String::from_utf8(plaintext)
            .map_err(|e| ConfigError::Decryption(format!("Invalid UTF-8: {}", e)))
    }

    /// Get a machine-specific identifier
    ///
    /// This uses a combination of hostname and other system identifiers
    /// to create a unique key for this machine.
    fn get_machine_id() -> Result<String> {
        // In a real implementation, you would use:
        // - Machine ID from /etc/machine-id (Linux)
        // - Registry key (Windows)
        // - IOPlatformUUID (macOS)
        //
        // For this example, we'll use hostname + username
        let hostname = hostname::get()
            .map_err(|e| ConfigError::Encryption(format!("Failed to get hostname: {}", e)))?
            .to_string_lossy()
            .to_string();

        let username = std::env::var("USER")
            .or_else(|_| std::env::var("USERNAME"))
            .unwrap_or_else(|_| "default".to_string());

        Ok(format!("{}:{}", hostname, username))
    }

    /// Derive encryption key from machine ID using Argon2
    fn derive_key(machine_id: &str) -> Result<[u8; 32]> {
        let salt = SaltString::from_b64("aGVsbG93b3JsZHNhbHQ")
            .map_err(|e| ConfigError::Encryption(format!("Invalid salt: {}", e)))?;

        let argon2 = Argon2::default();
        let hash = argon2
            .hash_password(machine_id.as_bytes(), &salt)
            .map_err(|e| ConfigError::Encryption(format!("Key derivation failed: {}", e)))?;

        let hash_bytes = hash
            .hash
            .ok_or_else(|| ConfigError::Encryption("Hash generation failed".to_string()))?;

        let mut key = [0u8; 32];
        key.copy_from_slice(&hash_bytes.as_bytes()[..32]);
        Ok(key)
    }
}

impl Default for SecureStorage {
    fn default() -> Self {
        Self::new().expect("Failed to create secure storage")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let storage = SecureStorage::new().unwrap();
        let plaintext = "Hello, World!";
        let ciphertext = storage.encrypt(plaintext).unwrap();
        let decrypted = storage.decrypt(&ciphertext).unwrap();
        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_encrypt_produces_different_ciphertext() {
        let storage = SecureStorage::new().unwrap();
        let plaintext = "Hello, World!";
        let ciphertext1 = storage.encrypt(plaintext).unwrap();
        let ciphertext2 = storage.encrypt(plaintext).unwrap();
        // Different nonces should produce different ciphertexts
        assert_ne!(ciphertext1, ciphertext2);
    }

    #[test]
    fn test_decrypt_invalid_data() {
        let storage = SecureStorage::new().unwrap();
        let result = storage.decrypt("invalid_base64!");
        assert!(result.is_err());
    }
}
