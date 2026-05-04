import { ConfigurationModule } from './ConfigurationModule';
import { SecretRotationHelper } from './SecretRotationHelper';

async function demo() {
  try {
    console.log('=== Azure Key Vault Configuration Provider Demo ===\n');

    const vaultUrl = process.env.AZURE_KEY_VAULT_URL || 'https://your-vault-name.vault.azure.net/';
    const config = new ConfigurationModule(vaultUrl, 7);

    console.log('\n--- Step 1: Bulk Loading Configuration ---');
    const requiredKeys = ['database-connection-string', 'api-key', 'smtp-password'];
    
    try {
      await config.initialize(requiredKeys);
    } catch (error: any) {
      console.log(`Note: Bulk load may fail if secrets don't exist yet. Error: ${error.message}`);
    }

    console.log('\n--- Step 2: Reading from Cache ---');
    const cachedProvider = config.getCachedProvider();
    
    for (const key of requiredKeys) {
      const value = cachedProvider.getCachedValue(key);
      const expiresOn = cachedProvider.getExpiryInfo(key);
      console.log(`${key}: ${value ? '***' + value.slice(-4) : 'not in cache'}`);
      if (expiresOn) {
        console.log(`  Expires: ${expiresOn.toISOString()}`);
      }
    }

    console.log('\n--- Step 3: On-Demand Refresh ---');
    const keyToRefresh = 'api-key';
    try {
      await cachedProvider.refreshSecret(keyToRefresh, 'default-api-key-value');
      console.log(`Successfully refreshed: ${keyToRefresh}`);
    } catch (error: any) {
      console.log(`Refresh note: ${error.message}`);
    }

    console.log('\n--- Step 4: Checking for Expiring Secrets ---');
    const expiringSoon = cachedProvider.getExpiringSoonSecrets();
    if (expiringSoon.length > 0) {
      console.log('⚠️  WARNING: The following secrets are expiring soon:');
      expiringSoon.forEach(name => {
        const expiryDate = cachedProvider.getExpiryInfo(name);
        console.log(`  - ${name} (expires: ${expiryDate?.toISOString()})`);
      });
    } else {
      console.log('✓ No secrets are expiring soon');
    }

    console.log('\n--- Step 5: Secret Rotation Demo ---');
    const rotationHelper = new SecretRotationHelper(config.getSecretClient());
    const testSecretName = 'demo-rotatable-secret';

    console.log(`\nCreating initial version of '${testSecretName}'...`);
    try {
      await rotationHelper.createNewVersionWithExpiry(
        testSecretName,
        'initial-secret-value-v1',
        30
      );
      console.log('Initial version created successfully');
    } catch (error: any) {
      console.log(`Note: ${error.message}`);
    }

    console.log(`\nRotating secret to new version...`);
    try {
      const newVersion = await rotationHelper.rotateSecret(
        testSecretName,
        'rotated-secret-value-v2',
        { expiryDays: 90, cleanupOldVersion: false }
      );
      console.log(`New version created: ${newVersion}`);
    } catch (error: any) {
      console.log(`Note: ${error.message}`);
    }

    console.log(`\nListing all versions of '${testSecretName}'...`);
    try {
      const versions = await rotationHelper.listSecretVersions(testSecretName);
      console.log(`Total versions: ${versions.length}`);
      versions.forEach((v, i) => console.log(`  Version ${i + 1}: ${v}`));
    } catch (error: any) {
      console.log(`Note: ${error.message}`);
    }

    console.log('\n--- Step 6: Delete and Purge Demo ---');
    const testDeleteSecret = 'demo-delete-purge-secret';
    
    console.log(`\nCreating temporary secret '${testDeleteSecret}' for deletion demo...`);
    try {
      await config.getSecretClient().setSecret(testDeleteSecret, 'temporary-value');
      console.log('Temporary secret created');

      console.log(`\nDeleting and purging '${testDeleteSecret}'...`);
      await rotationHelper.deleteAndPurgeSecret(testDeleteSecret);
      console.log('Delete and purge completed successfully');
    } catch (error: any) {
      console.log(`Note: ${error.message}`);
    }

    console.log('\n--- Step 7: Cache Statistics ---');
    console.log(`Cache size: ${cachedProvider.getCacheSize()} secrets`);

    console.log('\n=== Demo Complete ===');
    console.log('\nNote: This demo requires:');
    console.log('  1. AZURE_KEY_VAULT_URL environment variable set');
    console.log('  2. Azure authentication configured (managed identity or Azure CLI)');
    console.log('  3. Appropriate permissions on the Key Vault (Get, Set, Delete, Purge secrets)');
    
  } catch (error: any) {
    console.error('\n❌ Demo failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  - Ensure AZURE_KEY_VAULT_URL is set correctly');
    console.error('  - Verify Azure authentication is configured');
    console.error('  - Check Key Vault access policies or RBAC permissions');
    process.exit(1);
  }
}

if (require.main === module) {
  demo();
}

export { ConfigurationModule, SecretRotationHelper };
