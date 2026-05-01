import { ConfigurationManager } from './config';
import { KeyManager } from './keyManager';
import { EncryptedBlobStorage } from './blobStorage';

/**
 * Main demo script that demonstrates the full encrypt-upload-download-decrypt round-trip.
 */
async function main() {
  console.log('=== Azure Encrypted Blob Storage Demo ===\n');

  try {
    // Step 1: Initialize configuration
    console.log('1. Initializing Azure clients...');
    const configManager = new ConfigurationManager();
    const config = configManager.getConfig();
    console.log('✓ Configuration loaded\n');

    // Step 2: Initialize key manager and blob storage
    console.log('2. Setting up encryption services...');
    const keyManager = new KeyManager(
      config.keyClient,
      config.keyName,
      config.credential,
      config.keyVaultUrl
    );
    const blobStorage = new EncryptedBlobStorage(config.blobServiceClient, keyManager);
    console.log('✓ Encryption services ready\n');

    // Step 3: Prepare test data
    const containerName = 'encrypted-uploads';
    const blobName = `test-${Date.now()}.txt`;
    const sampleData = 'Hello, Azure! This is a secret message encrypted with envelope encryption using Key Vault and AES-256-GCM.';
    
    console.log('3. Test data prepared:');
    console.log(`   Container: ${containerName}`);
    console.log(`   Blob: ${blobName}`);
    console.log(`   Content: "${sampleData}"\n`);

    // Step 4: Encrypt and upload
    console.log('4. Encrypting and uploading...');
    const uploadResult = await blobStorage.uploadEncrypted(
      containerName,
      blobName,
      sampleData
    );
    
    console.log('✓ Upload successful!');
    console.log(`   Blob URL: ${uploadResult.url}`);
    console.log(`   Key Vault Key ID: ${uploadResult.keyId}`);
    console.log(`   Wrapped DEK (base64): ${uploadResult.wrappedKey.substring(0, 50)}...`);
    console.log(`   Wrapped DEK Length: ${uploadResult.wrappedKey.length} characters\n`);

    // Step 5: Download and decrypt
    console.log('5. Downloading and decrypting...');
    const downloadResult = await blobStorage.downloadDecrypted(
      containerName,
      blobName
    );
    
    const decryptedText = downloadResult.content.toString('utf-8');
    console.log('✓ Download and decryption successful!');
    console.log(`   Decrypted content: "${decryptedText}"\n`);

    // Step 6: Verify round-trip
    console.log('6. Verifying round-trip...');
    if (decryptedText === sampleData) {
      console.log('✓ SUCCESS! Round-trip verified - original and decrypted data match.\n');
    } else {
      console.error('✗ FAILURE! Data mismatch after round-trip.');
      console.error(`   Original:  "${sampleData}"`);
      console.error(`   Decrypted: "${decryptedText}"\n`);
      process.exit(1);
    }

    // Step 7: Metadata display
    console.log('7. Encryption metadata stored in blob:');
    console.log(`   Algorithm: ${downloadResult.metadata.algorithm}`);
    console.log(`   IV (base64): ${downloadResult.metadata.iv}`);
    console.log(`   Auth Tag (base64): ${downloadResult.metadata.authTag}`);
    console.log(`   Key ID: ${downloadResult.metadata.keyId}\n`);

    // Step 8: Cleanup (optional)
    console.log('8. Cleaning up...');
    await blobStorage.deleteBlob(containerName, blobName);
    console.log('✓ Test blob deleted\n');

    console.log('=== Demo completed successfully! ===');
    console.log('\nSecurity highlights:');
    console.log('  • Data encryption key (DEK) generated locally');
    console.log('  • DEK encrypted (wrapped) by Key Vault key');
    console.log('  • Raw DEK never persisted or transmitted');
    console.log('  • Key Vault key material never leaves Azure');
    console.log('  • AES-256-GCM provides authenticated encryption');
    console.log('  • All cryptographic parameters stored in blob metadata\n');

  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('\nCommon issues:');
    console.error('  • Ensure environment variables are set correctly');
    console.error('  • Verify managed identity has permissions for Key Vault and Storage');
    console.error('  • Check that the Key Vault key exists and is enabled');
    console.error('  • Confirm network connectivity to Azure services\n');
    process.exit(1);
  }
}

// Run the demo
main();
