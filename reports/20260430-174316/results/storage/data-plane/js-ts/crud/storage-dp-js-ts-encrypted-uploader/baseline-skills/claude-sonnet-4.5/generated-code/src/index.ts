import { AzureConfigManager } from './config';
import { KeyManagement } from './keyManagement';
import { EncryptedBlobUploader } from './blobUploader';

/**
 * Main demo script that demonstrates the full encrypt-upload-download-decrypt round-trip.
 * Encrypts and uploads a sample string, then downloads and decrypts it back.
 */
async function main() {
  console.log('=== Azure Encrypted Blob Uploader Demo ===\n');

  try {
    // Initialize Azure configuration
    console.log('Initializing Azure connections...');
    const config = AzureConfigManager.getConfig();
    console.log('✓ Connected to Azure services\n');

    // Initialize key management
    const keyManagement = new KeyManagement(config.keyClient, config.keyName);

    // Get and display the Key Vault key ID
    const keyId = await keyManagement.getKeyId();
    console.log(`Using Key Vault Key: ${keyId}\n`);

    // Initialize blob uploader
    const blobUploader = new EncryptedBlobUploader(
      config.blobServiceClient,
      keyManagement
    );

    // Sample data to encrypt and upload
    const sampleData = 'Hello, Azure! This is a secret message that will be encrypted with envelope encryption.';
    console.log(`Original data: "${sampleData}"\n`);

    // Upload encrypted data
    const containerName = 'encrypted-data';
    const blobName = `demo-${Date.now()}.txt`;

    console.log('Encrypting and uploading data...');
    const uploadResult = await blobUploader.uploadEncrypted(
      containerName,
      blobName,
      sampleData
    );

    console.log('✓ Data encrypted and uploaded successfully');
    console.log(`  Container: ${uploadResult.containerName}`);
    console.log(`  Blob: ${uploadResult.blobName}`);
    console.log(`  Key Vault Key ID: ${uploadResult.keyId}`);
    console.log(`  Wrapped DEK (base64): ${uploadResult.wrappedDEK.substring(0, 50)}...`);
    console.log(`  Full Wrapped DEK: ${uploadResult.wrappedDEK}\n`);

    // Download and decrypt data
    console.log('Downloading and decrypting data...');
    const downloadResult = await blobUploader.downloadDecrypted(
      containerName,
      blobName
    );

    const decryptedData = downloadResult.plaintext.toString('utf-8');
    console.log('✓ Data downloaded and decrypted successfully');
    console.log(`  Decrypted data: "${decryptedData}"\n`);

    // Verify round-trip
    if (decryptedData === sampleData) {
      console.log('✓ Round-trip verification PASSED: Original and decrypted data match!\n');
    } else {
      console.error('✗ Round-trip verification FAILED: Data mismatch!\n');
      process.exit(1);
    }

    // Clean up (optional - comment out if you want to keep the blob)
    console.log('Cleaning up demo blob...');
    await blobUploader.deleteBlob(containerName, blobName);
    console.log('✓ Demo blob deleted\n');

    console.log('=== Demo completed successfully ===');
  } catch (error) {
    console.error('\n✗ Error during demo:');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error('  Unknown error occurred');
    }
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main };
