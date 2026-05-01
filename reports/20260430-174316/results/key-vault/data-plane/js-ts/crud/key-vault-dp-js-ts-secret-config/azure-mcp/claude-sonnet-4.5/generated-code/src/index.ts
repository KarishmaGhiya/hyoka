import { ConfigurationModule } from './ConfigurationModule';
import { SecretRotationHelper } from './SecretRotationHelper';

/**
 * Demo script that showcases the full configuration provider flow
 */
async function main() {
  console.log('='.repeat(70));
  console.log('Azure Key Vault Configuration Provider Demo');
  console.log('='.repeat(70));
  console.log();

  try {
    // Step 1: Initialize the configuration module
    console.log('Step 1: Initializing Configuration Module');
    console.log('-'.repeat(70));
    
    const config = new ConfigurationModule({
      cacheOptions: {
        expiryWarningDays: 7,
        autoRefreshNearExpiry: true,
      },
    });
    console.log();

    // Step 2: Bulk load configuration keys at startup
    console.log('Step 2: Bulk Loading Configuration Keys');
    console.log('-'.repeat(70));
    
    const requiredKeys = [
      'DatabaseConnectionString',
      'ApiKey',
      'AppSecret',
    ];

    const defaults = {
      DatabaseConnectionString: 'default-connection-string',
      ApiKey: 'default-api-key',
      AppSecret: 'default-app-secret',
    };

    await config.initialize(requiredKeys, defaults);
    console.log();

    // Step 3: Read configuration values from cache
    console.log('Step 3: Reading Configuration from Cache');
    console.log('-'.repeat(70));
    
    for (const key of requiredKeys) {
      const value = await config.getConfig(key);
      const metadata = config.getProvider().getMetadata(key);
      
      console.log(`${key}:`);
      console.log(`  Value: ${value?.substring(0, 20)}... (truncated)`);
      console.log(`  Version: ${metadata?.version || 'N/A'}`);
      console.log(`  Expires: ${metadata?.expiresOn?.toISOString() || 'Never'}`);
      console.log();
    }

    // Step 4: Refresh a specific configuration key
    console.log('Step 4: Refreshing a Specific Key');
    console.log('-'.repeat(70));
    
    await config.refreshConfig('ApiKey');
    const refreshedValue = await config.getConfig('ApiKey');
    console.log(`Refreshed ApiKey: ${refreshedValue?.substring(0, 20)}... (truncated)`);
    console.log();

    // Step 5: Check for expiring secrets
    console.log('Step 5: Checking for Expiring Secrets');
    console.log('-'.repeat(70));
    
    const expiringSecrets = await config.checkHealth();
    if (expiringSecrets.length > 0) {
      console.log('⚠️  WARNING: The following secrets are near expiry:');
      for (const secretName of expiringSecrets) {
        const metadata = config.getProvider().getMetadata(secretName);
        console.log(`  - ${secretName} (expires: ${metadata?.expiresOn?.toISOString()})`);
      }
    } else {
      console.log('✓ All secrets are valid (no expiry warnings)');
    }
    console.log();

    // Step 6: Demonstrate secret rotation
    console.log('Step 6: Performing Secret Rotation');
    console.log('-'.repeat(70));
    
    const rotationHelper = new SecretRotationHelper(config.getSecretClient());
    
    // Create a new version of a secret
    const secretToRotate = 'AppSecret';
    const newSecretValue = `rotated-value-${Date.now()}`;
    
    console.log(`Rotating secret: ${secretToRotate}`);
    const newVersion = await rotationHelper.rotateSecret(secretToRotate, newSecretValue, {
      expiryDays: 90,
      contentType: 'application/secret',
      tags: {
        rotatedBy: 'demo-script',
        rotatedAt: new Date().toISOString(),
      },
    });
    
    console.log(`✓ New version created: ${newVersion}`);
    console.log();

    // List all versions
    console.log('Listing all versions of the secret:');
    const versions = await rotationHelper.listVersionsForCleanup(secretToRotate);
    versions.forEach((v, idx) => {
      console.log(`  ${idx + 1}. Version: ${v.version}`);
      console.log(`     Created: ${v.createdOn?.toISOString() || 'Unknown'}`);
      console.log(`     Expires: ${v.expiresOn?.toISOString() || 'Never'}`);
    });
    console.log();

    // Step 7: Demonstrate delete and purge (cleanup)
    console.log('Step 7: Demonstrating Delete and Purge Flow');
    console.log('-'.repeat(70));
    console.log('CAUTION: This will permanently delete the secret!');
    console.log('In production, carefully control when to purge secrets.');
    console.log();
    
    // For demo purposes, we'll create a temporary secret and then delete it
    const tempSecretName = `temp-demo-secret-${Date.now()}`;
    console.log(`Creating temporary secret for cleanup demo: ${tempSecretName}`);
    await rotationHelper.rotateSecret(tempSecretName, 'temporary-value', {
      expiryDays: 1,
    });
    console.log();
    
    console.log('Now performing delete and purge...');
    await rotationHelper.deleteAndPurgeSecret(tempSecretName, true);
    console.log();

    // Step 8: Show cache statistics
    console.log('Step 8: Cache Statistics');
    console.log('-'.repeat(70));
    
    const stats = config.getProvider().getCacheStats();
    console.log(`Cache size: ${stats.size}`);
    console.log(`Cached keys: ${stats.keys.join(', ')}`);
    console.log();

    console.log('='.repeat(70));
    console.log('Demo Complete!');
    console.log('='.repeat(70));
    console.log();
    console.log('Summary:');
    console.log('✓ Configuration module initialized with managed identity');
    console.log('✓ Bulk-loaded configuration keys at startup');
    console.log('✓ Read values from cache');
    console.log('✓ Refreshed individual keys on demand');
    console.log('✓ Checked for expiring secrets');
    console.log('✓ Rotated a secret (created new version)');
    console.log('✓ Demonstrated safe delete and purge workflow');
    console.log();

  } catch (error: any) {
    console.error();
    console.error('❌ Error during demo:');
    console.error(error.message);
    console.error();
    
    if (error.code === 'ENOTFOUND' || error.message.includes('vault')) {
      console.error('Hint: Make sure AZURE_KEYVAULT_URL environment variable is set');
      console.error('      Example: https://your-vault-name.vault.azure.net/');
    }
    
    if (error.message.includes('authentication') || error.message.includes('credential')) {
      console.error('Hint: Authentication failed. Make sure you have:');
      console.error('      - Azure CLI installed and logged in (az login)');
      console.error('      - OR running in Azure with managed identity enabled');
      console.error('      - OR appropriate environment variables set');
    }
    
    process.exit(1);
  }
}

// Run the demo
main();
