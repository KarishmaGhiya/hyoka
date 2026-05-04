import { AzureClientFactory } from "./config";
import { KeyManagementService } from "./keyManagement";
import { BlobEncryptorService } from "./blobEncryptor";

async function main() {
  console.log("=== Azure Blob Storage Client-Side Encryption Demo ===\n");

  try {
    // Step 1: Initialize Azure clients
    console.log("Initializing Azure clients...");
    const clientFactory = new AzureClientFactory();
    const config = clientFactory.getConfig();
    
    const keyClient = clientFactory.getKeyClient();
    const blobServiceClient = clientFactory.getBlobServiceClient();

    console.log(`Key Vault URL: ${config.keyVaultUrl}`);
    console.log(`Storage Account: ${config.storageAccountName}`);
    console.log(`Container: ${config.containerName}`);
    console.log(`Key Name: ${config.keyName}\n`);

    // Step 2: Initialize services
    const keyManagement = new KeyManagementService(keyClient, config.keyName);
    const blobEncryptor = new BlobEncryptorService(
      blobServiceClient,
      keyManagement,
      config.containerName
    );

    // Step 3: Ensure container exists
    console.log("Ensuring container exists...");
    await blobEncryptor.ensureContainer();
    console.log("✓ Container ready\n");

    // Step 4: Get Key Vault key information
    console.log("Fetching Key Vault key information...");
    const keyId = await keyManagement.getKeyId();
    console.log(`✓ Using Key Vault Key ID: ${keyId}\n`);

    // Step 5: Prepare sample data
    const sampleData = "Hello, Azure! This is a secret message encrypted with AES-256-GCM.";
    const blobName = `test-encrypted-${Date.now()}.txt`;
    
    console.log("=== ENCRYPTION & UPLOAD ===");
    console.log(`Original data: "${sampleData}"`);
    console.log(`Blob name: ${blobName}\n`);

    // Step 6: Encrypt and upload
    console.log("Encrypting data locally and uploading...");
    console.log("  → Generating 256-bit data encryption key (DEK)");
    console.log("  → Encrypting data with AES-256-GCM");
    console.log("  → Wrapping DEK with Key Vault");
    console.log("  → Uploading ciphertext + metadata to Blob Storage");
    
    await blobEncryptor.uploadEncrypted(blobName, sampleData);
    console.log("✓ Upload complete\n");

    // Step 7: Verify blob exists
    const exists = await blobEncryptor.blobExists(blobName);
    console.log(`✓ Blob exists in storage: ${exists}\n`);

    // Step 8: Download and decrypt
    console.log("=== DOWNLOAD & DECRYPTION ===");
    console.log("Downloading encrypted blob and decrypting...");
    console.log("  → Downloading ciphertext + metadata from Blob Storage");
    console.log("  → Unwrapping DEK with Key Vault");
    console.log("  → Decrypting data locally with AES-256-GCM");
    
    const decryptedData = await blobEncryptor.downloadDecrypted(blobName);
    const decryptedText = decryptedData.toString("utf-8");
    
    console.log("✓ Download and decryption complete\n");

    // Step 9: Verify round-trip
    console.log("=== VERIFICATION ===");
    console.log(`Decrypted data: "${decryptedText}"`);
    console.log(`Match: ${decryptedText === sampleData ? "✓ SUCCESS" : "✗ FAILED"}\n`);

    // Step 10: Display cryptographic details
    console.log("=== CRYPTOGRAPHIC DETAILS ===");
    const blockBlobClient = blobServiceClient
      .getContainerClient(config.containerName)
      .getBlockBlobClient(blobName);
    const properties = await blockBlobClient.getProperties();
    
    if (properties.metadata) {
      console.log(`Key Vault Key ID: ${properties.metadata.keyid}`);
      console.log(`Wrapping Algorithm: ${properties.metadata.algorithm}`);
      console.log(`Data Encryption: ${properties.metadata.encryptionalgorithm}`);
      console.log(`Wrapped DEK (base64): ${properties.metadata.wrappedkey.substring(0, 64)}...`);
      console.log(`IV (base64): ${properties.metadata.iv}`);
      console.log(`Auth Tag (base64): ${properties.metadata.authtag}\n`);
    }

    // Step 11: Cleanup
    console.log("Cleaning up test blob...");
    await blobEncryptor.deleteBlob(blobName);
    console.log("✓ Test blob deleted\n");

    console.log("=== Demo Complete ===");
    console.log("✓ Full encrypt-upload-download-decrypt round-trip successful!");

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error("\nPlease ensure:");
    console.error("  1. Environment variables are set (KEY_VAULT_URL, AZURE_STORAGE_ACCOUNT_NAME)");
    console.error("  2. Managed Identity has permissions to Key Vault and Blob Storage");
    console.error("  3. The encryption key exists in Key Vault");
    console.error("  4. Key Vault key has 'wrapKey' and 'unwrapKey' permissions enabled");
    process.exit(1);
  }
}

// Run the demo
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
