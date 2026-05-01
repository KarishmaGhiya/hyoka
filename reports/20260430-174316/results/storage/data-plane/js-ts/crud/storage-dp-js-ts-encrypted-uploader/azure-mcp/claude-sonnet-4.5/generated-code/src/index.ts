import { ConfigurationManager } from './config';
import { KeyManagementService } from './keyManagement';
import { EncryptedBlobService } from './blobStorage';

/**
 * Main demo script that demonstrates the full encrypt-upload-download-decrypt round-trip.
 */
async function main() {
  try {
    console.log('=== Azure Encrypted Blob Storage Demo ===\n');

    // Get configuration
    console.log('Initializing Azure connections...');
    const config = ConfigurationManager.getConfig();
    console.log('✓ Connected to Azure services\n');

    // Initialize services
    const keyManagementService = new KeyManagementService(
      config.keyClient,
      config.keyName
    );

    const encryptedBlobService = new EncryptedBlobService(
      config.blobServiceClient,
      keyManagementService,
      'encrypted-container'
    );

    // Get and display the Key Vault key ID
    const keyId = await keyManagementService.getKeyId();
    console.log(`Using Key Vault Key: ${keyId}\n`);

    // Sample data to encrypt and upload
    const originalData = 'Hello, Azure! This is a secret message that will be encrypted using envelope encryption with Azure Key Vault and stored in Blob Storage.';
    const blobName = `test-blob-${Date.now()}.enc`;

    console.log('Original data:');
    console.log(`  "${originalData}"\n`);

    // === UPLOAD AND ENCRYPT ===
    console.log('Step 1: Encrypting and uploading...');
    console.log('  - Generating 256-bit AES data encryption key (DEK) locally');
    console.log('  - Encrypting data with AES-256-GCM');
    console.log('  - Wrapping DEK with Key Vault key');
    console.log('  - Uploading ciphertext and metadata to Blob Storage');

    await encryptedBlobService.uploadEncrypted(blobName, originalData);
    console.log(`✓ Encrypted blob uploaded: ${blobName}\n`);

    // === DOWNLOAD AND DECRYPT ===
    console.log('Step 2: Downloading and decrypting...');
    console.log('  - Downloading encrypted blob and metadata');
    console.log('  - Unwrapping DEK with Key Vault key');
    console.log('  - Decrypting data locally with AES-256-GCM');

    const decryptedData = await encryptedBlobService.downloadDecrypted(blobName);
    const decryptedString = decryptedData.toString('utf-8');
    console.log(`✓ Blob downloaded and decrypted\n`);

    // === VERIFICATION ===
    console.log('=== Verification ===');
    console.log(`Vault Key ID: ${keyId}`);
    
    // Get wrapped DEK from blob metadata to display (for demonstration)
    const containerClient = config.blobServiceClient.getContainerClient('encrypted-container');
    const blobClient = containerClient.getBlockBlobClient(blobName);
    const properties = await blobClient.getProperties();
    const wrappedDEK = properties.metadata?.encryption_wrappedkey || 'N/A';
    console.log(`Wrapped DEK (base64): ${wrappedDEK.substring(0, 64)}...`);
    
    console.log(`\nDecrypted output: "${decryptedString}"`);
    
    // Verify round-trip success
    if (decryptedString === originalData) {
      console.log('\n✓ SUCCESS: Round-trip encryption/decryption verified!');
      console.log('  Original and decrypted data match perfectly.');
    } else {
      console.log('\n✗ ERROR: Data mismatch!');
      console.log('  Original and decrypted data do not match.');
    }

    // Cleanup
    console.log('\nCleaning up...');
    await encryptedBlobService.deleteBlob(blobName);
    console.log(`✓ Test blob deleted: ${blobName}`);

    console.log('\n=== Demo Complete ===');
  } catch (error) {
    console.error('\n✗ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the demo
main();
