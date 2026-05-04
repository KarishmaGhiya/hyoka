# Encryption Flow Diagram

## Upload Flow (Encryption)

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. GENERATE DATA ENCRYPTION KEY (DEK)                           │
│    - 32-byte random key (AES-256)                               │
│    - Generated locally using Node.js crypto.randomBytes()       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. ENCRYPT DATA LOCALLY                                          │
│    - Algorithm: AES-256-GCM                                      │
│    - Input: Plaintext + DEK + IV (12 bytes)                     │
│    - Output: Ciphertext + Authentication Tag (16 bytes)         │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. WRAP DEK WITH KEY VAULT                                       │
│    ┌──────────────────────────────────────────────┐             │
│    │        Azure Key Vault                       │             │
│    │   KEK (RSA-2048 key, never leaves vault)    │             │
│    │                                              │             │
│    │   wrapKey(algorithm="RSA-OAEP", dek)        │             │
│    │                                              │             │
│    │   Returns: Wrapped DEK (encrypted DEK)      │             │
│    └──────────────────────────────────────────────┘             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. UPLOAD TO BLOB STORAGE                                        │
│    ┌──────────────────────────────────────────────┐             │
│    │        Azure Blob Storage                    │             │
│    │                                              │             │
│    │  Blob Content: [Ciphertext]                 │             │
│    │                                              │             │
│    │  Blob Metadata:                             │             │
│    │    - wrappedKey: <base64>                   │             │
│    │    - keyId: <vault-key-id>                  │             │
│    │    - iv: <base64>                           │             │
│    │    - authTag: <base64>                      │             │
│    │    - algorithm: "aes-256-gcm"               │             │
│    └──────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

## Download Flow (Decryption)

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. DOWNLOAD FROM BLOB STORAGE                                    │
│    - Download ciphertext                                         │
│    - Extract metadata (wrapped DEK, IV, auth tag, key ID)       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. UNWRAP DEK WITH KEY VAULT                                     │
│    ┌──────────────────────────────────────────────┐             │
│    │        Azure Key Vault                       │             │
│    │                                              │             │
│    │   unwrapKey(                                 │             │
│    │     algorithm="RSA-OAEP",                    │             │
│    │     wrappedKey=<from-metadata>,              │             │
│    │     keyId=<from-metadata>                    │             │
│    │   )                                          │             │
│    │                                              │             │
│    │   Returns: Raw DEK (plaintext)              │             │
│    └──────────────────────────────────────────────┘             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. DECRYPT DATA LOCALLY                                          │
│    - Algorithm: AES-256-GCM                                      │
│    - Input: Ciphertext + DEK + IV + Auth Tag                    │
│    - Verify: Authentication tag (detects tampering)             │
│    - Output: Plaintext                                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. RETURN DECRYPTED DATA                                         │
│    - Clear DEK from memory (dataKey.fill(0))                    │
│    - Return plaintext to caller                                 │
└──────────────────────────────────────────────────────────────────┘
```

## Security Properties

### ✅ What's Protected
- **Data at Rest**: Ciphertext in Blob Storage is encrypted with AES-256-GCM
- **Data in Transit**: HTTPS encryption for all Azure SDK operations
- **Key Material**: DEK wrapped with RSA-OAEP, KEK never leaves Key Vault
- **Data Integrity**: GCM authentication tag prevents tampering
- **Key Rotation**: Each blob stores key ID, supports rotating KEK

### ✅ What's NOT Stored in Plaintext
- Raw data encryption key (DEK)
- Plaintext data
- Key Vault key material

### ✅ What IS Stored
- Ciphertext (encrypted data)
- Wrapped DEK (encrypted with Key Vault's key)
- IV (public, unique per encryption)
- Authentication tag (public, for integrity verification)
- Key Vault key ID (public, identifies which KEK was used)

## Key Rotation Strategy

When a Key Vault key is rotated:
1. Old blobs still store the old key's ID in metadata
2. Key Vault maintains old key versions for decryption
3. New uploads use the latest key version automatically
4. No need to re-encrypt existing blobs immediately
5. Can re-encrypt blobs over time with new key version
