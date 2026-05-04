# Expected Demo Output

When you run `npm start` in an Azure environment with proper managed identity permissions, you'll see output like this:

```
=== Azure Blob Storage Client-Side Encryption Demo ===

Initializing Azure clients...
Key Vault URL: https://your-keyvault.vault.azure.net
Storage Account: yourstorageaccount
Container: encrypted-files
Key Name: encryption-key

Ensuring container exists...
✓ Container ready

Fetching Key Vault key information...
✓ Using Key Vault Key ID: https://your-keyvault.vault.azure.net/keys/encryption-key/abc123def456

=== ENCRYPTION & UPLOAD ===
Original data: "Hello, Azure! This is a secret message encrypted with AES-256-GCM."
Blob name: test-encrypted-1735776000000.txt

Encrypting data locally and uploading...
  → Generating 256-bit data encryption key (DEK)
  → Encrypting data with AES-256-GCM
  → Wrapping DEK with Key Vault
  → Uploading ciphertext + metadata to Blob Storage
✓ Upload complete

✓ Blob exists in storage: true

=== DOWNLOAD & DECRYPTION ===
Downloading encrypted blob and decrypting...
  → Downloading ciphertext + metadata from Blob Storage
  → Unwrapping DEK with Key Vault
  → Decrypting data locally with AES-256-GCM
✓ Download and decryption complete

=== VERIFICATION ===
Decrypted data: "Hello, Azure! This is a secret message encrypted with AES-256-GCM."
Match: ✓ SUCCESS

=== CRYPTOGRAPHIC DETAILS ===
Key Vault Key ID: https://your-keyvault.vault.azure.net/keys/encryption-key/abc123def456
Wrapping Algorithm: RSA-OAEP
Data Encryption: aes-256-gcm
Wrapped DEK (base64): JHB8dG9rZW5pemVyfDxdeyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZHQ00i...
IV (base64): mK5p8q3t6w9z$C&F
Auth Tag (base64): 4t7w!z%C*F-JaNdRgUkXp2s

Cleaning up test blob...
✓ Test blob deleted

=== Demo Complete ===
✓ Full encrypt-upload-download-decrypt round-trip successful!
```

## Understanding the Output

### Initialization Phase
- Shows all configuration values being used
- Confirms connection to both Azure services
- Displays the Key Vault key ID (includes version for tracking)

### Encryption & Upload Phase
- Shows the original plaintext data
- Lists each step of the encryption process:
  1. Local DEK generation (32 random bytes)
  2. Local encryption with AES-256-GCM
  3. Remote DEK wrapping with Key Vault
  4. Upload of ciphertext + metadata to Blob Storage

### Download & Decryption Phase
- Shows the reverse process:
  1. Download blob and metadata from storage
  2. Remote DEK unwrapping with Key Vault
  3. Local decryption with recovered DEK
  4. Authentication tag verification

### Verification Phase
- Displays the decrypted plaintext
- Confirms it matches the original (round-trip success)

### Cryptographic Details
- **Key Vault Key ID**: Full URL including version
  - Format: `https://{vault}.vault.azure.net/keys/{name}/{version}`
  - The version ensures old blobs can be decrypted even after key rotation
  
- **Wrapping Algorithm**: `RSA-OAEP`
  - Used to wrap/unwrap the DEK
  - Operation happens inside Key Vault HSM
  
- **Data Encryption**: `aes-256-gcm`
  - Algorithm used for the actual data encryption
  - Performed locally (client-side)
  
- **Wrapped DEK**: Base64-encoded ciphertext (truncated in output)
  - This is the encrypted DEK
  - Safe to store in blob metadata
  - Can only be decrypted by Key Vault
  
- **IV**: 96-bit initialization vector (base64)
  - Random value generated for each encryption
  - Required for AES-GCM decryption
  - Safe to store in plaintext
  
- **Auth Tag**: 128-bit authentication tag (base64)
  - Produced by AES-GCM encryption
  - Verifies data integrity and authenticity
  - Must match during decryption or operation fails

## Error Scenarios

### Missing Environment Variables
```
❌ Error: KEY_VAULT_URL environment variable is required

Please ensure:
  1. Environment variables are set (KEY_VAULT_URL, AZURE_STORAGE_ACCOUNT_NAME)
  2. Managed Identity has permissions to Key Vault and Blob Storage
  3. The encryption key exists in Key Vault
  4. Key Vault key has 'wrapKey' and 'unwrapKey' permissions enabled
```

### Key Vault Key Not Found
```
❌ Error: Key Vault key 'encryption-key' not found. Please create it first.

Please ensure:
  1. Environment variables are set (KEY_VAULT_URL, AZURE_STORAGE_ACCOUNT_NAME)
  2. Managed Identity has permissions to Key Vault and Blob Storage
  3. The encryption key exists in Key Vault
  4. Key Vault key has 'wrapKey' and 'unwrapKey' permissions enabled
```

### Access Denied
```
❌ Error: Access denied to Key Vault key 'encryption-key'. Check permissions.

Please ensure:
  1. Environment variables are set (KEY_VAULT_URL, AZURE_STORAGE_ACCOUNT_NAME)
  2. Managed Identity has permissions to Key Vault and Blob Storage
  3. The encryption key exists in Key Vault
  4. Key Vault key has 'wrapKey' and 'unwrapKey' permissions enabled
```

### Key Disabled During Decryption
```
❌ Error: Access denied when unwrapping key. The key may have been disabled or permissions revoked.

Please ensure:
  1. Environment variables are set (KEY_VAULT_URL, AZURE_STORAGE_ACCOUNT_NAME)
  2. Managed Identity has permissions to Key Vault and Blob Storage
  3. The encryption key exists in Key Vault
  4. Key Vault key has 'wrapKey' and 'unwrapKey' permissions enabled
```

## What Gets Stored in Blob Storage

### Blob Content (binary)
The blob contains the **ciphertext only** - the encrypted data. This is binary data that looks like random bytes and cannot be decrypted without:
1. The wrapped DEK from metadata
2. Access to the Key Vault to unwrap the DEK
3. The IV and auth tag from metadata

### Blob Metadata (key-value pairs)
All cryptographic parameters needed for decryption:

| Metadata Key | Example Value | Purpose |
|--------------|---------------|---------|
| `iv` | `mK5p8q3t6w9z$C&F` | Initialization vector for AES-GCM |
| `authtag` | `4t7w!z%C*F-JaNdRg...` | Authentication tag for integrity |
| `wrappedkey` | `JHB8dG9rZW5pemVy...` | Encrypted DEK (256 bytes base64) |
| `keyid` | `https://vault...` | Key Vault key used for wrapping |
| `algorithm` | `RSA-OAEP` | Wrapping algorithm |
| `encryptionalgorithm` | `aes-256-gcm` | Data encryption algorithm |

**Security Note**: All metadata values are safe to store unencrypted because:
- IV and auth tag are non-secret by design
- Wrapped DEK is encrypted and can only be decrypted by Key Vault
- Key ID is a reference, not the key itself

## Performance Characteristics

Based on typical Azure service performance:

- **Encryption time** (local): ~1-5ms for 1KB, ~50-100ms for 1MB
- **Key wrap operation**: ~10-50ms (network call to Key Vault)
- **Blob upload**: Varies by size and network (10-100ms for small files)
- **Total upload**: ~100-200ms for typical small files

For a 64-byte message (like the demo):
- Total encrypt + upload: ~100-150ms
- Total download + decrypt: ~100-150ms
- Round-trip: ~200-300ms

The Key Vault operations (wrap/unwrap) are the slowest part, but they're necessary for security and key management.
