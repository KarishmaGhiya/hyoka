import { AzureConfig } from "./config";
import { KeyManager } from "./keyManager";
import { EncryptedBlobUploader } from "./blobUploader";

/**
 * Main demo script that demonstrates the full encrypt-upload-download-decrypt round-trip.
 * 
 * Flow:
 * 1. Configure Azure clients (Blob Storage + Key Vault)
 * 2. Encrypt a sample string and upload to Blob Storage
 * 3. Download and decrypt the blob
 * 4. Verify the round-trip succeeded
 */
async function main() {
  console.log("=== Azure Encrypted Blob Storage Demo ===\n");

  try {
    // Step 1: Initialize Azure clients
    console.log("1. Initializing Azure clients...");
    const blobServiceClient = AzureConfig.createBlobServiceClient();
    const keyClient = AzureConfig.createKeyClient();
    const keyName = AzureConfig.getKeyName();
    const containerName = AzureConfig.getContainerName();

    console.log(`   - Key Vault URL: ${keyClient.vaultUrl}`);
    console.log(`   - Key Name: ${keyName}`);
    console.log(`   - Storage Account: ${blobServiceClient.url}`);
    console.log(`   - Container: ${containerName}\n`);

    // Step 2: Create key manager and blob uploader
    console.log("2. Setting up encryption services...");
    const keyManager = new KeyManager(keyClient, keyName);
    const blobUploader = new EncryptedBlobUploader(blobServiceClient, containerName, keyManager);

    // Ensure the container exists
    await blobUploader.ensureContainer();
    console.log("   - Container ready\n");

    // Step 3: Get Key Vault key ID for reference
    const keyId = await keyManager.getKeyId();
    console.log(`3. Using Key Vault key: ${keyId}\n`);

    // Step 4: Encrypt and upload a sample string
    const sampleData = "Hello, Azure! This is a secret message encrypted with client-side encryption using Azure Key Vault.";
    const blobName = `encrypted-demo-${Date.now()}.txt`;

    console.log("4. Encrypting and uploading data...");
    console.log(`   - Blob name: ${blobName}`);
    console.log(`   - Original data: "${sampleData}"`);
    console.log(`   - Data size: ${sampleData.length} bytes\n`);

    const metadata = await blobUploader.uploadEncrypted(blobName, sampleData);

    console.log("5. Upload complete! Encryption metadata:");
    console.log(`   - Algorithm: ${metadata.encryptionAlgorithm}`);
    console.log(`   - Key ID: ${metadata.keyId}`);
    console.log(`   - Wrapped DEK (base64): ${metadata.wrappedKey.substring(0, 64)}...`);
    console.log(`   - IV (base64): ${metadata.iv}`);
    console.log(`   - Auth Tag (base64): ${metadata.authTag}\n`);

    // Step 5: Download and decrypt
    console.log("6. Downloading and decrypting...");
    const decryptedData = await blobUploader.downloadDecrypted(blobName);
    const decryptedString = decryptedData.toString("utf-8");

    console.log(`   - Decrypted data: "${decryptedString}"`);
    console.log(`   - Decrypted size: ${decryptedData.length} bytes\n`);

    // Step 6: Verify round-trip
    console.log("7. Verifying round-trip...");
    if (decryptedString === sampleData) {
      console.log("   ✓ SUCCESS! Decrypted data matches original data\n");
    } else {
      console.log("   ✗ FAILURE! Decrypted data does not match original data\n");
      process.exit(1);
    }

    // Step 7: Cleanup (optional - uncomment to delete the demo blob)
    console.log("8. Cleanup...");
    console.log(`   - Demo blob '${blobName}' left in storage for inspection`);
    console.log(`   - To delete: uncomment the cleanup code in src/index.ts\n`);
    
    // Uncomment the following line to delete the demo blob:
    // await blobUploader.deleteBlob(blobName);
    // console.log(`   - Deleted blob '${blobName}'\n`);

    console.log("=== Demo Complete ===");
    console.log("\nKey Points:");
    console.log("- Data was encrypted locally before upload");
    console.log("- The raw data encryption key never left memory");
    console.log("- Key Vault protected the data key (envelope encryption)");
    console.log("- The blob metadata contains all info needed for decryption");
    console.log("- AES-GCM provides both confidentiality and authenticity");

  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : "Unknown error");
    console.error("\nPlease ensure:");
    console.error("- AZURE_STORAGE_ACCOUNT_NAME is set");
    console.error("- AZURE_STORAGE_CONTAINER_NAME is set");
    console.error("- AZURE_KEY_VAULT_URL is set (e.g., https://myvault.vault.azure.net)");
    console.error("- AZURE_KEY_VAULT_KEY_NAME is set");
    console.error("- You have proper permissions to access both services");
    console.error("- The Key Vault key exists and is enabled");
    process.exit(1);
  }
}

// Run the demo
main();
