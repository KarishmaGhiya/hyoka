import { AzureConnectionManager } from './config';
import { EncryptedBlobUploader } from './blobUploader';

async function main() {
  console.log('=== Azure Encrypted Blob Storage Demo ===\n');

  try {
    // Initialize Azure connections
    console.log('1. Initializing Azure connections...');
    const connectionManager = new AzureConnectionManager();
    const config = connectionManager.getConfig();
    
    console.log(`   Key Vault URL: ${config.keyVaultUrl}`);
    console.log(`   Key Name: ${config.keyVaultKeyName}`);
    console.log(`   Storage Account: ${config.storageAccountUrl}`);
    console.log(`   Container: ${config.storageContainerName}\n`);

    // Initialize Key Management Service
    const keyManagement = connectionManager.getKeyManagementService();

    // Initialize Encrypted Blob Uploader
    const containerClient = connectionManager.getContainerClient();
    const blobUploader = new EncryptedBlobUploader(containerClient, keyManagement);

    // Sample data to encrypt and upload
    const sampleData = 'Hello, Azure! This is a secret message encrypted with envelope encryption using Azure Key Vault and AES-256-GCM.';
    const blobName = `demo-encrypted-${Date.now()}.txt`;

    console.log('2. Sample data to encrypt:');
    console.log(`   "${sampleData}"\n`);

    // Encrypt and upload
    console.log('3. Encrypting and uploading to Blob Storage...');
    await blobUploader.uploadEncrypted(blobName, sampleData);

    // Retrieve the blob properties to display encryption metadata
    console.log('\n4. Retrieving blob metadata...');
    const blobClient = containerClient.getBlockBlobClient(blobName);
    const properties = await blobClient.getProperties();
    const metadata = properties.metadata;

    if (metadata) {
      console.log(`   Vault Key ID: ${metadata.keyId}`);
      console.log(`   Wrapped DEK (base64): ${metadata.wrappedKey.substring(0, 64)}...`);
      console.log(`   IV (base64): ${metadata.iv}`);
      console.log(`   Auth Tag (base64): ${metadata.authTag}`);
      console.log(`   Encryption Algorithm: ${metadata.encryptionAlgorithm}\n`);
    }

    // Download and decrypt
    console.log('5. Downloading and decrypting...');
    const decryptedData = await blobUploader.downloadDecrypted(blobName);
    const decryptedText = decryptedData.toString('utf-8');

    console.log('\n6. Decrypted data:');
    console.log(`   "${decryptedText}"\n`);

    // Verify round-trip
    if (decryptedText === sampleData) {
      console.log('✅ SUCCESS: Round-trip encryption/decryption verified!');
      console.log('   Original and decrypted data match perfectly.\n');
    } else {
      console.log('❌ ERROR: Decrypted data does not match original!');
      console.log(`   Expected: "${sampleData}"`);
      console.log(`   Got: "${decryptedText}"\n`);
    }

    // Cleanup
    console.log('7. Cleaning up...');
    await blobUploader.deleteBlob(blobName);
    console.log('\n=== Demo Complete ===');

  } catch (error) {
    console.error('\n❌ Error during demo:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      
      // Provide helpful error messages
      if (error.message.includes('Required environment variable')) {
        console.error('\n💡 Tip: Create a .env file with the required configuration.');
        console.error('   See .env.example for the required variables.');
      } else if (error.message.includes('Authentication failed')) {
        console.error('\n💡 Tip: Ensure your managed identity or Azure CLI credentials have:');
        console.error('   - Key Vault Crypto User role on the Key Vault');
        console.error('   - Storage Blob Data Contributor role on the Storage Account');
      } else if (error.message.includes('getaddrinfo ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 Tip: Check that the Key Vault and Storage Account URLs are correct.');
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the demo
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
