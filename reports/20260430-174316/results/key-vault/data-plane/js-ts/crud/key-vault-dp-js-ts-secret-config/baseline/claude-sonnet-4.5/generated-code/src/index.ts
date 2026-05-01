import { CachedSecretProvider } from './CachedSecretProvider';
import { SecretRotationHelper } from './SecretRotationHelper';

async function main() {
  // Read vault URL from environment variable
  const vaultUrl = process.env.AZURE_KEYVAULT_URL;

  if (!vaultUrl) {
    console.error(
      'ERROR: AZURE_KEYVAULT_URL environment variable not set'
    );
    console.log(
      '\nUsage: Set AZURE_KEYVAULT_URL to your Key Vault URL (e.g., https://my-vault.vault.azure.net/)'
    );
    console.log(
      'Note: This demo requires a running Azure Key Vault and proper authentication (managed identity or Azure CLI login)\n'
    );
    return;
  }

  console.log('='.repeat(70));
  console.log('Azure Key Vault Configuration Provider Demo');
  console.log('='.repeat(70));
  console.log(`Vault URL: ${vaultUrl}\n`);

  // Initialize cached provider with 7-day expiry warning
  const cachedProvider = new CachedSecretProvider(vaultUrl, {
    expiryWarningDays: 7,
  });

  // Step 1: Bulk load several config keys at startup
  console.log('\n--- STEP 1: Bulk Loading Config Keys ---');
  const requiredKeys = [
    'database-connection-string',
    'api-key',
    'storage-account-key',
  ];

  const loadedSecrets = await cachedProvider.bulkLoad(requiredKeys);
  console.log('\nLoaded secrets:');
  for (const [name, value] of loadedSecrets.entries()) {
    console.log(`  - ${name}: ${maskSecret(value)}`);
  }

  // Step 2: Read secrets from cache (should hit cache)
  console.log('\n--- STEP 2: Reading Secrets from Cache ---');
  for (const key of requiredKeys) {
    const value = await cachedProvider.getSecret(key);
    if (value) {
      console.log(`  ${key}: ${maskSecret(value)}`);
    }
  }

  // Step 3: Refresh one secret on-demand
  console.log('\n--- STEP 3: On-Demand Refresh ---');
  const keyToRefresh = 'api-key';
  console.log(`Invalidating '${keyToRefresh}' from cache...`);
  cachedProvider.invalidateSecret(keyToRefresh);

  const refreshedValue = await cachedProvider.getSecret(keyToRefresh);
  if (refreshedValue) {
    console.log(`Refreshed ${keyToRefresh}: ${maskSecret(refreshedValue)}`);
  }

  // Step 4: Check for secrets expiring soon
  console.log('\n--- STEP 4: Checking for Expiring Secrets ---');
  const expiringSecrets = await cachedProvider.getExpiringSoonSecrets();

  if (expiringSecrets.size > 0) {
    console.log(
      '\n⚠️  WARNING: The following secrets are expiring within 7 days:'
    );
    for (const [name, expiresOn] of expiringSecrets.entries()) {
      const daysUntilExpiry = Math.ceil(
        (expiresOn.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      console.log(`  - ${name}: expires ${expiresOn.toISOString()} (${daysUntilExpiry} days)`);
    }
  } else {
    console.log('✓ No secrets expiring within the warning window');
  }

  // Step 5: Secret rotation demonstration
  console.log('\n--- STEP 5: Secret Rotation Demo ---');
  const rotationHelper = new SecretRotationHelper(vaultUrl);
  const demoSecretName = 'demo-rotatable-secret';

  // Create initial version
  console.log(`\nCreating initial version of '${demoSecretName}'...`);
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 90); // 90 days from now

  await rotationHelper.createNewSecretVersion(demoSecretName, {
    newValue: 'initial-secret-value-v1',
    expiresOn: expiryDate,
    contentType: 'text/plain',
    tags: { environment: 'demo', version: 'v1' },
  });

  // Rotate the secret (create new version)
  console.log(`\nRotating '${demoSecretName}' with new value...`);
  const newExpiryDate = new Date();
  newExpiryDate.setDate(newExpiryDate.getDate() + 90);

  await rotationHelper.rotateSecret(demoSecretName, {
    newValue: 'rotated-secret-value-v2',
    expiresOn: newExpiryDate,
    contentType: 'text/plain',
    tags: { environment: 'demo', version: 'v2' },
  });

  // List all versions
  console.log(`\nListing all versions of '${demoSecretName}'...`);
  const provider = cachedProvider.getProvider();
  const versions = await provider.listSecretVersions(demoSecretName);
  console.log(`Found ${versions.length} version(s): ${versions.join(', ')}`);

  // Step 6: Cleanup demonstration (delete and purge)
  console.log('\n--- STEP 6: Cleanup Demo (Delete & Purge) ---');
  console.log(
    '\nNote: This demonstrates the safe delete-and-purge flow.'
  );
  console.log(
    'In production, you typically keep old versions for rollback capability.'
  );

  try {
    await rotationHelper.deleteAndPurgeSecret(demoSecretName);
  } catch (error: any) {
    console.error(`Cleanup failed: ${error.message}`);
    console.log(
      'This is expected if soft-delete protection is enabled on the vault.'
    );
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('Demo Complete!');
  console.log('='.repeat(70));
  console.log('\nKey features demonstrated:');
  console.log('  ✓ Bulk loading of config keys at startup');
  console.log('  ✓ In-memory caching with cache hits');
  console.log('  ✓ On-demand secret refresh');
  console.log('  ✓ Expiry warning detection (7-day window)');
  console.log('  ✓ Secret rotation (creating new versions)');
  console.log('  ✓ Safe cleanup (delete + purge with proper waiting)');
  console.log('  ✓ Managed identity authentication (DefaultAzureCredential)');
  console.log('');
}

function maskSecret(value: string): string {
  if (value.length <= 8) {
    return '****';
  }
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}

// Run the demo
main().catch((error) => {
  console.error('\n❌ Fatal error:', error.message);
  if (error.code === 'ENOTFOUND' || error.statusCode === 401) {
    console.log(
      '\nTroubleshooting:'
    );
    console.log('  1. Verify AZURE_KEYVAULT_URL is correct');
    console.log('  2. Ensure you are authenticated (az login or managed identity)');
    console.log('  3. Check that your identity has proper Key Vault permissions');
    console.log('     Required: "Get", "Set", "Delete", "Purge", "List" permissions');
  }
  process.exit(1);
});
