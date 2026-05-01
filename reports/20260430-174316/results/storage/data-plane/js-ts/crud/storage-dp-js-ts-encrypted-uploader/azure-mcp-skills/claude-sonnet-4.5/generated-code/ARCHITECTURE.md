# Architecture Diagram

## System Components

┌─────────────────────────────────────────────────────────────────────────────┐
│                         Client Application (Node.js)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ConfigurationManager                            │   │
│  │  • DefaultAzureCredential (Managed Identity)                      │   │
│  │  • BlobServiceClient                                              │   │
│  │  • KeyClient                                                      │   │
│  └────────────────────┬───────────────────────┬────────────────────────┘   │
│                       │                       │                            │
│  ┌────────────────────▼──────────────┐   ┌───▼────────────────────────┐   │
│  │       KeyManager                  │   │  EncryptedBlobStorage      │   │
│  │  • Envelope Encryption            │◄──┤  • Upload/Download         │   │
│  │  • AES-256-GCM                    │   │  • Stream Handling         │   │
│  │  • DEK Generation                 │   │  • Metadata Management     │   │
│  │  • Wrap/Unwrap via Key Vault      │   └────────────────────────────┘   │
│  └────────────────────┬──────────────┘                                     │
│                       │                                                     │
└───────────────────────┼─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
        ▼                                ▼
┌────────────────────┐         ┌──────────────────────┐
│  Azure Key Vault   │         │  Azure Blob Storage  │
├────────────────────┤         ├──────────────────────┤
│                    │         │                      │
│  Key Encryption    │         │  Container           │
│  Key (KEK)         │         │    └─ Encrypted Blob │
│                    │         │         ├─ Ciphertext│
│  • RSA-OAEP-256    │         │         └─ Metadata: │
│  • Wrap DEK        │         │            • Wrapped │
│  • Unwrap DEK      │         │              DEK     │
│                    │         │            • IV      │
│  KEK never leaves  │         │            • AuthTag │
│  Key Vault         │         │            • Key ID  │
└────────────────────┘         └──────────────────────┘


## Encryption Flow (Upload)

┌──────────────┐
│  Plaintext   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│  1. Generate DEK (256-bit)       │
│     randomBytes(32)              │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  2. Encrypt Data Locally         │
│     AES-256-GCM                  │
│     plaintext + DEK + IV         │
│     → ciphertext + authTag       │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  3. Wrap DEK with Key Vault      │
│     KeyVault.wrapKey()           │
│     DEK + KEK → Wrapped DEK      │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  4. Erase DEK from Memory        │
│     dek.fill(0)                  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  5. Upload to Blob Storage       │
│     Data: ciphertext             │
│     Metadata:                    │
│       - wrappedKey               │
│       - iv                       │
│       - authTag                  │
│       - keyId                    │
└──────────────────────────────────┘


## Decryption Flow (Download)

┌──────────────────────────────────┐
│  1. Download from Blob Storage   │
│     Get: ciphertext + metadata   │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  2. Unwrap DEK with Key Vault    │
│     KeyVault.unwrapKey()         │
│     Wrapped DEK + KEK → DEK      │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  3. Decrypt Data Locally         │
│     AES-256-GCM                  │
│     ciphertext + DEK + IV        │
│     → plaintext                  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  4. Verify Auth Tag              │
│     GCM authentication           │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  5. Erase DEK from Memory        │
│     dek.fill(0)                  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────┐
│  Plaintext   │
└──────────────┘


## Security Layers

Layer 1: Physical Security
  └─ Azure Data Centers (ISO 27001, SOC 2)

Layer 2: Network Security
  └─ HTTPS/TLS for all Azure API calls

Layer 3: Authentication
  └─ Managed Identity / Azure AD

Layer 4: Authorization
  └─ Azure RBAC
      ├─ Key Vault Crypto User (wrap/unwrap only)
      └─ Storage Blob Data Contributor

Layer 5: Key Management
  └─ Azure Key Vault
      ├─ KEK stored in HSM (optional)
      ├─ Key rotation support
      └─ Audit logging

Layer 6: Data Encryption
  └─ Client-Side Encryption
      ├─ AES-256-GCM (authenticated encryption)
      ├─ Unique DEK per blob
      ├─ Random IV per encryption
      └─ DEK never persisted


## Key Hierarchy

┌─────────────────────────────────────┐
│   Master Key (Azure Key Vault)      │  ◄── Managed by Azure
│   • RSA 2048/3072/4096              │      (can be HSM-backed)
│   • Never leaves Key Vault          │
│   • Used for wrap/unwrap only       │
└────────────┬────────────────────────┘
             │
             │ wraps/unwraps
             │
┌────────────▼────────────────────────┐
│   Data Encryption Key (DEK)         │  ◄── Generated per upload
│   • AES-256 (32 bytes)              │      Exists only in memory
│   • Random per blob                 │      Erased after use
│   • Never stored raw                │
└────────────┬────────────────────────┘
             │
             │ encrypts/decrypts
             │
┌────────────▼────────────────────────┐
│   Actual Data (Plaintext)           │
│   • Your sensitive content          │
│   • Files, strings, buffers         │
└─────────────────────────────────────┘


## Data Flow Summary

WRITE PATH:
  User Data → [Local AES-256-GCM] → Ciphertext
           ↘
            Random DEK → [Key Vault Wrap] → Wrapped DEK
                                              ↓
                          Blob Storage ← [Ciphertext + Wrapped DEK]

READ PATH:
  Blob Storage → [Ciphertext + Wrapped DEK]
                                ↓
                   Wrapped DEK → [Key Vault Unwrap] → DEK
                                                        ↓
                                   Ciphertext → [Local AES-256-GCM] → User Data


## Components Interaction Matrix

                    │ KeyManager │ BlobStorage │ Key Vault │ Blob Storage
────────────────────┼────────────┼─────────────┼───────────┼──────────────
ConfigManager       │   Creates  │   Creates   │  Connects │  Connects
KeyManager          │     -      │   Used by   │  Wrap/    │     -
                    │            │             │  Unwrap   │
EncryptedBlobStorage│   Uses     │     -       │     -     │  Upload/
                    │            │             │           │  Download
User Application    │   Uses     │   Uses      │     -     │     -


## File Organization

src/
├── config.ts          → Manages Azure connections
│   └── ConfigurationManager
│       ├── credential: DefaultAzureCredential
│       ├── blobServiceClient: BlobServiceClient
│       └── keyClient: KeyClient
│
├── keyManager.ts      → Handles envelope encryption
│   └── KeyManager
│       ├── encryptData()   → plaintext → EncryptedData
│       ├── decryptData()   → EncryptedData → plaintext
│       ├── wrapKey()       → DEK → Wrapped DEK
│       └── unwrapKey()     → Wrapped DEK → DEK
│
├── blobStorage.ts     → Manages encrypted blob operations
│   └── EncryptedBlobStorage
│       ├── uploadEncrypted()     → data → blob
│       ├── downloadDecrypted()   → blob → data
│       ├── deleteBlob()
│       └── streamToBuffer()
│
└── index.ts           → Demo application
    └── main()
        ├── Initialize services
        ├── Upload encrypted blob
        ├── Download and decrypt
        └── Verify round-trip


## Environment Variables

┌───────────────────────────────────┐
│  AZURE_STORAGE_ACCOUNT_NAME       │ → Blob Service URL
│  AZURE_KEY_VAULT_URL              │ → Key Client
│  AZURE_KEY_VAULT_KEY_NAME         │ → Specific Key
└───────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────┐
│  DefaultAzureCredential           │
│  • Managed Identity               │
│  • Azure CLI (local dev)          │
│  • Environment variables          │
│  • Visual Studio                  │
└───────────────────────────────────┘
