import { ConfigurationModule } from './ConfigurationModule';
import { SecretRotationHelper } from './SecretRotationHelper';

async function main() {
  console.log('=== Azure Key Vault Configuration Provider Demo ===\n');

  // Note: Set AZURE_KEYVAULT_URL environment variable before running
  // For managed identity in Azure, no additional credentials needed
  // For local development, you may need AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
  
  const vaultUrl = process.env.AZURE_KEYVAULT_URL;
  if (!vaultUrl) {
    console.error('ERROR: AZURE_KEYVAULT_URL environment variable not set');
    console.log('Example: https://your-keyvault-name.vault.azure.net/');
    process.exit(1);
  }

  console.log(`Vault URL: ${vaultUrl}\n`);

  try {
    // Initialize configuration module with managed identity
    const config = new ConfigurationModule(vaultUrl, 7);
    const cachingProvider = config.getCachingProvider();
    const provider = config.getProvider();
    const client = config.getClient();
    const rotationHelper = new SecretRotationHelper(client, provider);

    // Step 1: Bulk-load configuration keys at startup
    console.log('Step 1: Bulk-loading configuration keys...');
    const requiredKeys = ['app-db-connection', 'app-api-key', 'app-service-url'];
    
    // Create demo secrets if they don't exist
    console.log('Setting up demo secrets...');
    const futureExpiry = new Date();
    futureExpiry.setDate(futureExpiry.getDate() + 30); // 30 days from now
    
    const nearExpiry = new Date();
    nearExpiry.setDate(nearExpiry.getDate() + 5); // 5 days from now (near expiry)

    await provider.setSecret('app-db-connection', 'Server=db.example.com;Database=myapp', futureExpiry);
    await provider.setSecret('app-api-key', 'demo-api-key-12345', nearExpiry);
    await provider.setSecret('app-service-url', 'https://api.example.com', futureExpiry);
    
    await config.initialize(requiredKeys);
    console.log('✓ Bulk-load complete\n');

    // Step 2: Read secrets from cache
    console.log('Step 2: Reading secrets from cache...');
    for (const key of requiredKeys) {
      const value = await cachingProvider.get(key);
      console.log(`  ${key}: ${value}`);
    }
    
    const stats = cachingProvider.getCacheStats();
    console.log(`\nCache stats: ${stats.size} keys cached`);
    console.log(`Cached keys: ${stats.keys.join(', ')}\n`);

    // Step 3: Refresh a single key
    console.log('Step 3: Refreshing single key (app-api-key)...');
    await cachingProvider.refresh('app-api-key');
    const refreshedValue = await cachingProvider.get('app-api-key');
    console.log(`  app-api-key (refreshed): ${refreshedValue}\n`);

    // Step 4: Check for secrets near expiry
    console.log('Step 4: Checking for secrets near expiry...');
    const expiringSecrets = cachingProvider.getExpiringSecrets();
    if (expiringSecrets.length > 0) {
      console.log('⚠️  WARNING: The following secrets are near expiry:');
      for (const secret of expiringSecrets) {
        const daysUntilExpiry = Math.ceil(
          (secret.expiresOn.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        console.log(`  - ${secret.name}: expires in ${daysUntilExpiry} days (${secret.expiresOn.toISOString()})`);
      }
    } else {
      console.log('✓ No secrets near expiry');
    }
    console.log();

    // Step 5: Demonstrate secret rotation
    console.log('Step 5: Performing secret rotation...');
    const secretToRotate = 'app-rotation-demo';
    
    // Create initial secret
    console.log(`Creating initial secret '${secretToRotate}'...`);
    const initialExpiry = new Date();
    initialExpiry.setDate(initialExpiry.getDate() + 10);
    await provider.setSecret(secretToRotate, 'initial-value-v1', initialExpiry);
    
    const initialInfo = await provider.getSecretInfo(secretToRotate);
    console.log(`  Initial version: ${initialInfo?.version}`);
    console.log(`  Initial value: ${initialInfo?.value}`);
    
    // Rotate the secret (create new version)
    console.log(`\nRotating secret to new version...`);
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 90);
    const rotationResult = await rotationHelper.rotateSecret(
      secretToRotate,
      'rotated-value-v2',
      newExpiry
    );
    console.log(`  Old version: ${rotationResult.oldVersion}`);
    console.log(`  New version: ${rotationResult.newVersion}`);
    
    // Verify new version
    const rotatedInfo = await provider.getSecretInfo(secretToRotate);
    console.log(`  New value: ${rotatedInfo?.value}`);
    console.log(`  New expiry: ${rotatedInfo?.expiresOn?.toISOString()}\n`);
    
    // List all versions
    console.log('Listing all versions:');
    const versions = await rotationHelper.listVersions(secretToRotate);
    for (const v of versions) {
      console.log(`  - Version ${v.version} (enabled: ${v.enabled})`);
    }
    console.log();

    // Step 6: Demonstrate delete-and-purge cleanup
    console.log('Step 6: Demonstrating delete-and-purge cleanup...');
    console.log('Note: This permanently removes the secret from Key Vault');
    console.log('      In production, consider carefully before purging!\n');
    
    await rotationHelper.deleteAndPurge(secretToRotate);
    console.log('✓ Cleanup complete\n');

    // Verify secret is gone
    const deletedInfo = await provider.getSecretInfo(secretToRotate);
    console.log(`Verification: Secret '${secretToRotate}' exists: ${deletedInfo !== null}`);

    console.log('\n=== Demo Complete ===');
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.statusCode) {
      console.error('Status code:', error.statusCode);
    }
    process.exit(1);
  }
}

main();
