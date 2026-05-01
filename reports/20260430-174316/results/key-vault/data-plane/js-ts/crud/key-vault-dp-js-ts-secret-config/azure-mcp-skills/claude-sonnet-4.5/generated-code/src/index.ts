import { Configuration } from './Configuration';
import { SecretRotationHelper } from './SecretRotationHelper';

async function main() {
  console.log('='.repeat(60));
  console.log('Azure Key Vault Configuration Provider Demo');
  console.log('='.repeat(60));
  console.log();

  const vaultUrl = process.env.KEY_VAULT_URL;
  if (!vaultUrl) {
    console.error('ERROR: KEY_VAULT_URL environment variable must be set');
    console.log('\nExample:');
    console.log('  export KEY_VAULT_URL="https://your-vault-name.vault.azure.net/"');
    process.exit(1);
  }

  try {
    const config = new Configuration(vaultUrl, 7);
    const cache = config.getCache();
    const provider = config.getProvider();
    const rotationHelper = new SecretRotationHelper(config.getClient());

    console.log('\n--- Step 1: Bulk Load Configuration Keys ---\n');
    const configKeys = ['database-connection-string', 'api-key', 'service-token'];
    await config.initialize(configKeys);

    console.log('\n--- Step 2: Read Values from Cache ---\n');
    for (const key of configKeys) {
      const value = cache.getCached(key);
      if (value !== undefined) {
        const masked = value.length > 8 ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : '***';
        console.log(`  ${key}: ${masked}`);
      } else {
        console.log(`  ${key}: (not in cache)`);
      }
    }

    console.log('\n--- Step 3: Refresh Individual Key ---\n');
    const keyToRefresh = 'api-key';
    console.log(`Refreshing '${keyToRefresh}'...`);
    await cache.refresh(keyToRefresh);
    console.log(`✓ '${keyToRefresh}' refreshed successfully`);

    console.log('\n--- Step 4: Check for Expiring Secrets ---\n');
    const expiring = cache.getExpiringSecrets();
    if (expiring.length > 0) {
      console.log('⚠️  WARNING: The following secrets are expiring soon:');
      for (const { key, expiresOn } of expiring) {
        const daysUntil = Math.ceil((expiresOn.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        console.log(`  - ${key}: expires in ${daysUntil} days (${expiresOn.toISOString()})`);
      }
    } else {
      console.log('✓ No secrets are expiring within the warning window');
    }

    console.log('\n--- Step 5: Secret Rotation Demo ---\n');
    const secretName = 'demo-rotatable-secret';
    const newSecretValue = `rotated-value-${Date.now()}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90);

    console.log(`Creating/updating secret '${secretName}'...`);
    const newVersion = await rotationHelper.rotateSecret(secretName, newSecretValue, {
      expiresOn: expiryDate,
      tags: { rotatedAt: new Date().toISOString() },
    });
    console.log(`✓ New version created: ${newVersion}`);

    console.log('\nListing all versions...');
    const versions = await rotationHelper.listVersions(secretName);
    console.log(`Total versions: ${versions.length}`);
    versions.slice(0, 3).forEach((v, i) => {
      console.log(`  ${i + 1}. Version ${v.version} (enabled: ${v.enabled}, created: ${v.createdOn?.toISOString()})`);
    });

    console.log('\n--- Step 6: Delete and Purge Cleanup Demo ---\n');
    console.log('NOTE: This will soft-delete and purge the secret.');
    console.log('Demonstrating the long-running delete operation...\n');
    
    try {
      await rotationHelper.deleteAndPurgeOldVersion(secretName);
      console.log('✓ Cleanup completed successfully');
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.log('Secret not found (may have been deleted already)');
      } else {
        console.error(`Cleanup error: ${error.message}`);
      }
    }

    console.log('\n--- Demo Complete ---\n');
    console.log('✓ All operations completed successfully');
    console.log('\nKey Features Demonstrated:');
    console.log('  • Managed Identity authentication');
    console.log('  • Bulk loading with caching');
    console.log('  • Individual key refresh');
    console.log('  • Expiry detection and warnings');
    console.log('  • Secret rotation (multi-version support)');
    console.log('  • Safe delete and purge operations');
    console.log();

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    if (error.statusCode === 401) {
      console.error('\nAuthentication failed. Ensure:');
      console.error('  1. You are running in Azure with Managed Identity enabled');
      console.error('  2. Or you have run "az login" locally');
      console.error('  3. The identity has proper Key Vault permissions');
    }
    process.exit(1);
  }
}

main();
