import { ConfigurationModule } from './ConfigurationModule';
import { SecretRotationHelper } from './SecretRotationHelper';

async function main() {
  console.log('='.repeat(70));
  console.log('Azure Key Vault Configuration Provider Demo');
  console.log('='.repeat(70));
  console.log();

  // Initialize the configuration module
  // Vault URL comes from AZURE_KEYVAULT_URL environment variable
  const config = new ConfigurationModule({
    cacheOptions: {
      expiryWarningDays: 7, // Warn if secret expires within 7 days
    },
  });

  // Get providers for demo
  const secretProvider = config.getSecretProvider();
  const cachedProvider = config.getCachedProvider();
  const secretClient = config.getSecretClient();
  const rotationHelper = new SecretRotationHelper(secretClient);

  // -------------------------------------------------------------------------
  // STEP 1: Bulk-load required configuration keys at startup
  // -------------------------------------------------------------------------
  console.log('STEP 1: Bulk-loading configuration keys at startup');
  console.log('-'.repeat(70));
  
  const requiredKeys = [
    'DatabaseConnectionString',
    'ApiKey',
    'ServicePassword',
  ];

  await config.initialize(requiredKeys);
  console.log();

  // -------------------------------------------------------------------------
  // STEP 2: Read values from cache
  // -------------------------------------------------------------------------
  console.log('STEP 2: Reading values from cache');
  console.log('-'.repeat(70));

  for (const key of requiredKeys) {
    const value = await config.get(key, 'NOT_FOUND');
    const metadata = cachedProvider.getCachedMetadata(key);
    
    console.log(`${key}:`);
    console.log(`  Value: ${value?.substring(0, 20)}${value && value.length > 20 ? '...' : ''}`);
    if (metadata?.expiresOn) {
      console.log(`  Expires: ${metadata.expiresOn.toISOString()}`);
    }
    if (metadata?.version) {
      console.log(`  Version: ${metadata.version}`);
    }
    console.log();
  }

  // -------------------------------------------------------------------------
  // STEP 3: On-demand refresh of a single key
  // -------------------------------------------------------------------------
  console.log('STEP 3: On-demand refresh of a single key');
  console.log('-'.repeat(70));
  
  const keyToRefresh = 'ApiKey';
  console.log(`Refreshing: ${keyToRefresh}`);
  await config.refresh(keyToRefresh);
  const refreshedValue = await config.get(keyToRefresh);
  console.log(`✓ Refreshed value: ${refreshedValue?.substring(0, 20)}...`);
  console.log();

  // -------------------------------------------------------------------------
  // STEP 4: Check for expiring secrets
  // -------------------------------------------------------------------------
  console.log('STEP 4: Checking for expiring secrets');
  console.log('-'.repeat(70));
  
  const expiring = await config.checkExpiry();
  
  if (expiring.size === 0) {
    console.log('✓ No secrets are expiring soon.');
  }
  console.log();

  // -------------------------------------------------------------------------
  // STEP 5: Demonstrate secret rotation
  // -------------------------------------------------------------------------
  console.log('STEP 5: Secret rotation demo');
  console.log('-'.repeat(70));
  
  const secretToRotate = 'DemoSecret';
  
  // First, create or update the secret
  console.log(`Setting initial value for: ${secretToRotate}`);
  const initialVersion = await rotationHelper.rotateSecret(
    secretToRotate,
    'initial-secret-value-' + Date.now(),
    {
      expiryDays: 90,
      contentType: 'application/text',
      tags: { environment: 'demo', owner: 'config-system' },
    }
  );
  console.log(`Initial version: ${initialVersion}`);
  console.log();

  // List all versions
  console.log('Listing all versions:');
  const versions = await rotationHelper.listSecretVersions(secretToRotate);
  console.log(`  Found ${versions.length} version(s): ${versions.join(', ')}`);
  console.log();

  // Rotate the secret (create new version)
  console.log('Rotating secret (creating new version)...');
  const newVersion = await rotationHelper.rotateSecret(
    secretToRotate,
    'rotated-secret-value-' + Date.now(),
    {
      expiryDays: 90,
      contentType: 'application/text',
      tags: { environment: 'demo', owner: 'config-system', rotated: 'true' },
    }
  );
  console.log(`New version: ${newVersion}`);
  console.log();

  // List versions after rotation
  console.log('Listing versions after rotation:');
  const versionsAfter = await rotationHelper.listSecretVersions(secretToRotate);
  console.log(`  Found ${versionsAfter.length} version(s): ${versionsAfter.join(', ')}`);
  console.log();

  // -------------------------------------------------------------------------
  // STEP 6: Demonstrate delete and purge cleanup (optional)
  // -------------------------------------------------------------------------
  console.log('STEP 6: Delete and purge cleanup demo');
  console.log('-'.repeat(70));
  console.log('NOTE: This will delete and purge the demo secret.');
  console.log('In production, you typically keep versions for rollback.');
  console.log();

  // Demonstrate the safe delete-and-purge flow
  console.log('Performing delete and purge...');
  await rotationHelper.cleanupSecret(secretToRotate, {
    deleteOldVersion: true,
    purgeAfterDelete: true,
  });
  console.log('✓ Cleanup complete');
  console.log();

  // -------------------------------------------------------------------------
  // STEP 7: Demonstrate checking if secret exists
  // -------------------------------------------------------------------------
  console.log('STEP 7: Graceful handling of missing secrets');
  console.log('-'.repeat(70));
  
  const nonExistentKey = 'NonExistentSecret';
  const defaultValue = 'fallback-value';
  
  console.log(`Attempting to get: ${nonExistentKey}`);
  const value = await secretProvider.getSecret(nonExistentKey, defaultValue);
  console.log(`Result: ${value}`);
  console.log(`✓ Gracefully returned default value instead of crashing`);
  console.log();

  // -------------------------------------------------------------------------
  console.log('='.repeat(70));
  console.log('Demo completed successfully!');
  console.log('='.repeat(70));
}

// Run the demo
main().catch((error) => {
  console.error('Error running demo:', error);
  process.exit(1);
});
