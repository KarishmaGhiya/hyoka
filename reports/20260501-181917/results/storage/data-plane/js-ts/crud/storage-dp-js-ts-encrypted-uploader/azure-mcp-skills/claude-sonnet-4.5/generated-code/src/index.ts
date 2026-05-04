import { AzureConnections } from "./config.js";
import { KeyManagement } from "./keyManagement.js";
import { EncryptedBlobStorage } from "./encryptedBlobStorage.js";

/**
 * Demo: Encrypt-Upload-Download-Decrypt round-trip
 */
async function main() {
  console.log("=== Azure Encrypted Blob Storage Demo ===\n");

  try {
    // Step 1: Load configuration from environment
    console.log("1. Loading configuration...");
    const connections = AzureConnections.fromEnvironment();
    const config = connections.getConfig();
    console.log(`   Storage Account: ${config.storageAccountName}`);
    console.log(`   Key Vault: ${config.keyVaultName}`);
    console.log(`   Key Name: ${config.keyName}`);
    console.log(`   Container: ${config.containerName}\n`);

    // Step 2: Initialize services
    console.log("2. Initializing services...");
    const keyManagement = new KeyManagement(
      connections.keyClient,
      config.keyName,
      (keyId) => connections.getCryptographyClient(keyId)
    );

    // Ensure key exists
    await keyManagement.ensureKeyExists();

    const containerClient = connections.blobServiceClient.getContainerClient(config.containerName);
    const blobStorage = new EncryptedBlobStorage(containerClient, keyManagement);

    // Ensure container exists
    await blobStorage.ensureContainerExists();
    console.log();

    // Step 3: Encrypt and upload sample data
    console.log("3. Encrypting and uploading data...");
    const sampleData = "This is a secret message that will be encrypted with AES-256-GCM!";
    const blobName = `demo-${Date.now()}.txt`;
    
    console.log(`   Original data: "${sampleData}"`);
    console.log(`   Data size: ${sampleData.length} bytes\n`);

    const blobClient = await blobStorage.uploadEncrypted(blobName, sampleData);

    // Display encryption metadata
    const properties = await blobClient.getProperties();
    console.log("\n   Encryption Metadata:");
    console.log(`   - Key ID: ${properties.metadata?.keyId}`);
    console.log(`   - Wrapped DEK: ${properties.metadata?.wrappedKey?.substring(0, 32)}...`);
    console.log(`   - Algorithm: ${properties.metadata?.algorithm}`);
    console.log(`   - IV: ${properties.metadata?.iv}`);
    console.log(`   - Auth Tag: ${properties.metadata?.authTag}\n`);

    // Step 4: Download and decrypt
    console.log("4. Downloading and decrypting data...");
    const decryptedData = await blobStorage.downloadDecrypted(blobName);
    const decryptedText = decryptedData.toString("utf-8");
    
    console.log(`   Decrypted data: "${decryptedText}"`);
    console.log(`   Data size: ${decryptedData.length} bytes\n`);

    // Step 5: Verify round-trip
    console.log("5. Verifying round-trip...");
    if (sampleData === decryptedText) {
      console.log("   ✓ SUCCESS: Decrypted data matches original!\n");
    } else {
      console.log("   ✗ FAILURE: Decrypted data does not match original!\n");
      process.exit(1);
    }

    // Step 6: List all blobs
    console.log("6. Listing blobs in container...");
    const blobs = await blobStorage.listBlobs();
    console.log(`   Found ${blobs.length} blob(s):`);
    for (const blob of blobs) {
      console.log(`   - ${blob}`);
    }

    console.log("\n=== Demo completed successfully! ===");
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error("\nStack trace:", error.stack);
    process.exit(1);
  }
}

// Run the demo
main();
