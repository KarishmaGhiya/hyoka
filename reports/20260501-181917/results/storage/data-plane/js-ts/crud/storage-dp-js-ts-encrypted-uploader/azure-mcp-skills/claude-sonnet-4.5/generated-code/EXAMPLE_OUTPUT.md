# Example Output

This shows what the demo script outputs when run successfully.

## Console Output

```
=== Azure Encrypted Blob Storage Demo ===

1. Loading configuration...
   Storage Account: mystorageaccount
   Key Vault: mykeyvault
   Key Name: my-encryption-key
   Container: encrypted-files

2. Initializing services...
Container 'encrypted-files' is ready.

3. Encrypting and uploading data...
   Original data: "This is a secret message that will be encrypted with AES-256-GCM!"
   Data size: 66 bytes

✓ Uploaded encrypted blob: demo-1746151234567.txt (80 bytes)

   Encryption Metadata:
   - Key ID: https://mykeyvault.vault.azure.net/keys/my-encryption-key/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   - Wrapped DEK: JKLMNOPQRSTUVWXYZabcdefghijklmno...
   - Algorithm: aes-256-gcm
   - IV: AB12CD34EF56GH78IJ90
   - Auth Tag: ZY98XW76VU54TS32RQ10

4. Downloading and decrypting data...
✓ Downloaded and decrypted blob: demo-1746151234567.txt (66 bytes)
   Decrypted data: "This is a secret message that will be encrypted with AES-256-GCM!"
   Data size: 66 bytes

5. Verifying round-trip...
   ✓ SUCCESS: Decrypted data matches original!

6. Listing blobs in container...
   Found 3 blob(s):
   - demo-1746151234567.txt
   - demo-1746150123456.txt
   - demo-1746149012345.txt

=== Demo completed successfully! ===
```

## Blob Metadata Example

When you inspect the uploaded blob in Azure Portal, you'll see metadata like:

| Key | Value |
|-----|-------|
| `iv` | `AB12CD34EF56GH78IJ90` |
| `authTag` | `ZY98XW76VU54TS32RQ10` |
| `wrappedKey` | `JKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ...` |
| `keyId` | `https://mykeyvault.vault.azure.net/keys/my-encryption-key/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` |
| `algorithm` | `aes-256-gcm` |

## Error Scenarios

### Missing Environment Variables
```
❌ Error: AZURE_STORAGE_ACCOUNT_NAME environment variable is required
```

### Key Vault Key Not Found
```
2. Initializing services...
Key 'my-encryption-key' not found, creating it...
Key 'my-encryption-key' created successfully.
Container 'encrypted-files' is ready.
```

### Access Denied (Missing RBAC)
```
❌ Error: Access denied to key 'my-encryption-key'. Check RBAC permissions (requires 'Key Vault Crypto User' role).
```

### Blob Not Found
```
❌ Error: Blob 'nonexistent.txt' not found in container 'encrypted-files'.
```

### Tampered Data
```
❌ Error: Decryption failed. The blob may be corrupted or tampered with.
```

## What Happens Behind the Scenes

### During Upload:
1. **Local**: Generate 32-byte random DEK
2. **Local**: Encrypt plaintext with DEK using AES-256-GCM
3. **Key Vault API Call**: Wrap DEK using RSA-OAEP
4. **Blob Storage API Call**: Upload ciphertext with metadata
5. **Memory**: Clear DEK (fill with zeros)

### During Download:
1. **Blob Storage API Call**: Download ciphertext and metadata
2. **Key Vault API Call**: Unwrap DEK using RSA-OAEP
3. **Local**: Decrypt ciphertext using recovered DEK
4. **Local**: Verify authentication tag (GCM)
5. **Memory**: Clear DEK (fill with zeros)

## Performance Notes

For the demo data (66 bytes):
- **Encryption time**: ~1-2ms (local, negligible)
- **Key Vault wrap**: ~50-100ms (network call)
- **Blob upload**: ~50-200ms (network call, depends on region)
- **Total upload**: ~100-300ms

For the demo data (66 bytes):
- **Blob download**: ~50-200ms (network call)
- **Key Vault unwrap**: ~50-100ms (network call)
- **Decryption time**: ~1-2ms (local, negligible)
- **Total download**: ~100-300ms

**Key Insight**: The Key Vault operations (wrap/unwrap) are the bottleneck, not the local encryption/decryption. For large files, the Key Vault overhead becomes relatively smaller as a percentage of total time.
