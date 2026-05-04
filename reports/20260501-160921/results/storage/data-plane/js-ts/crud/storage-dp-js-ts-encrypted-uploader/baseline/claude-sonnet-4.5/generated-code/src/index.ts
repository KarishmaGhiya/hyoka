import { buildAzureConfig } from './config';
import { KeyManagementService } from './keyManagement';
import { EncryptedBlobStorage } from './blobStorage';

async function main() {
  console.log('=== Azure Encrypted Blob Storage Demo ===\n');

  try {
    console.log('1. Initializing Azure services...');
    const config = buildAzureConfig();
    console.log(`   - Storage Account: ${config.blobServiceClient.accountName}`);
    console.log(`   - Container: ${config.containerName}`);
    console.log(`   - Key Vault Key: ${config.keyVaultKeyName}\n`);

    const keyManagement = new KeyManagementService(config.keyClient, config.keyVaultKeyName);
    const blobStorage = new EncryptedBlobStorage(
      config.blobServiceClient,
      keyManagement,
      config.containerName
    );

    const testData = 'Hello, Azure! This is a secret message that will be encrypted client-side.';
    const blobName = `test-encrypted-${Date.now()}.txt`;

    console.log('2. Encrypting and uploading data...');
    console.log(`   - Original data: "${testData}"`);
    console.log(`   - Blob name: ${blobName}`);

    const uploadResult = await blobStorage.uploadEncrypted(blobName, testData);

    console.log('\n3. Upload completed:');
    console.log(`   - Blob URL: ${uploadResult.url}`);
    console.log(`   - Key Vault Key ID: ${uploadResult.keyId}`);
    console.log(`   - Wrapped DEK (base64): ${uploadResult.wrappedKeyBase64.substring(0, 50)}...`);

    console.log('\n4. Downloading and decrypting data...');
    const decryptedData = await blobStorage.downloadDecrypted(blobName);
    const decryptedString = decryptedData.toString('utf-8');

    console.log('\n5. Decryption completed:');
    console.log(`   - Decrypted data: "${decryptedString}"`);

    console.log('\n6. Verification:');
    if (testData === decryptedString) {
      console.log('   ✓ SUCCESS: Decrypted data matches original!');
    } else {
      console.log('   ✗ FAILURE: Decrypted data does not match original!');
      console.log(`   Expected: "${testData}"`);
      console.log(`   Got: "${decryptedString}"`);
    }

    console.log('\n=== Demo completed successfully ===');
  } catch (error) {
    console.error('\n=== Error occurred ===');
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
