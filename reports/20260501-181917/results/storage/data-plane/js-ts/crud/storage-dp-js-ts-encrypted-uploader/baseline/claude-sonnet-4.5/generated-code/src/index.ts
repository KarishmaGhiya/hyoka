import { createAzureConfig } from "./config";
import { KeyManager } from "./keyManager";
import { BlobEncryptionClient } from "./blobEncryption";

async function main() {
  try {
    console.log("=== Azure Blob Storage Client-Side Encryption Demo ===\n");

    const config = createAzureConfig();
    console.log("✓ Azure clients initialized");
    console.log(`  Key Vault Key: ${config.keyVaultKeyName}\n`);

    const keyManager = new KeyManager(config.keyClient, config.keyVaultKeyName);

    const containerName = "encrypted-data";
    const blobClient = new BlobEncryptionClient(
      config.blobServiceClient,
      containerName,
      keyManager
    );

    await blobClient.ensureContainer();
    console.log(`✓ Container '${containerName}' ready\n`);

    const sampleData = "Hello, Azure! This is sensitive data encrypted with envelope encryption.";
    const blobName = `sample-${Date.now()}.txt`;

    console.log("--- UPLOAD & ENCRYPT ---");
    console.log(`Original data: "${sampleData}"`);
    console.log(`Blob name: ${blobName}\n`);

    const metadata = await blobClient.uploadEncrypted(blobName, sampleData);

    console.log("✓ Encrypted and uploaded successfully");
    console.log(`  Key Vault Key ID: ${metadata.keyId}`);
    console.log(`  Wrapped DEK (base64): ${metadata.wrappedKey.substring(0, 60)}...`);
    console.log(`  IV (base64): ${metadata.iv}`);
    console.log(`  Auth Tag (base64): ${metadata.authTag}\n`);

    console.log("--- DOWNLOAD & DECRYPT ---");
    const decryptedBuffer = await blobClient.downloadDecrypted(blobName);
    const decryptedText = decryptedBuffer.toString("utf-8");

    console.log("✓ Downloaded and decrypted successfully");
    console.log(`  Decrypted data: "${decryptedText}"\n`);

    if (decryptedText === sampleData) {
      console.log("✅ SUCCESS: Round-trip encryption/decryption verified!");
    } else {
      console.log("❌ ERROR: Decrypted data does not match original!");
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
