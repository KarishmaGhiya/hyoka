import { AzureConfig } from './config';
import { KeyManager } from './keyManager';
import { BlobUploader } from './blobUploader';

/**
 * Main demo script that demonstrates the complete encrypt-upload-download-decrypt workflow
 */
async function main() {
  console.log('=== Azure Blob Storage Client-Side Encryption Demo ===\n');

  try {
    // Initialize Azure clients
    console.log('Initializing Azure clients...');
    const keyClient = AzureConfig.getKeyClient();
    const blobServiceClient = AzureConfig.getBlobServiceClient();
    const keyName = AzureConfig.getKeyName();
    const containerName = AzureConfig.getContainerName();

    console.log(`✓ Key Vault URL: ${process.env.AZURE_KEYVAULT_URL}`);
    console.log(`✓ Storage Account URL: ${process.env.AZURE_STORAGE_ACCOUNT_URL}`);
    console.log(`✓ Key Name: ${keyName}`);
    console.log(`✓ Container Name: ${containerName}\n`);

    // Initialize key manager and blob uploader
    const keyManager = new KeyManager(keyClient, keyName);
    const blobUploader = new BlobUploader(blobServiceClient, keyManager, containerName);

    // Ensure container exists
    await blobUploader.ensureContainer();
    console.log('✓ Container ready\n');

    // Sample data to encrypt
    const testData = 'Hello, Azure! This is a secret message encrypted with envelope encryption using Azure Key Vault and AES-256-GCM.';
    const blobName = `test-encrypted-${Date.now()}.txt`;

    console.log('--- ENCRYPTION & UPLOAD ---');
    console.log(`Original data: "${testData}"`);
    console.log(`Data size: ${testData.length} bytes\n`);

    // Demonstrate the encryption process with detailed output
    console.log('Encrypting data...');
    const dataBuffer = Buffer.from(testData, 'utf-8');
    const encryptionResult = await keyManager.encryptData(dataBuffer);
    
    console.log(`✓ Data encrypted with AES-256-GCM`);
    console.log(`  Vault Key ID: ${encryptionResult.keyId}`);
    console.log(`  Wrapped DEK (base64): ${encryptionResult.wrappedKey.substring(0, 64)}...`);
    console.log(`  IV (base64): ${encryptionResult.iv}`);
    console.log(`  Auth Tag (base64): ${encryptionResult.authTag}`);
    console.log(`  Ciphertext size: ${encryptionResult.ciphertext.length} bytes\n`);

    // Upload the encrypted blob
    console.log('Uploading encrypted blob...');
    await blobUploader.uploadEncrypted(blobName, testData);
    console.log();

    // Download and decrypt the blob
    console.log('--- DOWNLOAD & DECRYPTION ---');
    console.log('Downloading and decrypting blob...');
    const decryptedData = await blobUploader.downloadDecrypted(blobName);
    const decryptedText = decryptedData.toString('utf-8');

    console.log(`Decrypted data: "${decryptedText}"`);
    console.log(`Decrypted size: ${decryptedData.length} bytes\n`);

    // Verify round-trip
    console.log('--- VERIFICATION ---');
    const roundTripSuccess = testData === decryptedText;
    if (roundTripSuccess) {
      console.log('✓ Round-trip successful! Original and decrypted data match.');
    } else {
      console.log('✗ Round-trip failed! Data mismatch.');
    }

    // Cleanup
    console.log('\n--- CLEANUP ---');
    await blobUploader.deleteBlob(blobName);

    console.log('\n=== Demo Complete ===');
    process.exit(0);

  } catch (error) {
    console.error('\n✗ Error during demo:');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(`  ${String(error)}`);
    }
    process.exit(1);
  }
}

// Run the demo
main();
