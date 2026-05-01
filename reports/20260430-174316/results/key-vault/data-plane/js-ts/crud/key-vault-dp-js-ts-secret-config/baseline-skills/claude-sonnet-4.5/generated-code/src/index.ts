import { SecretProvider } from './secretProvider';
import { CachingProvider } from './cachingProvider';
import { SecretRotationHelper } from './secretRotation';

async function main() {
  console.log('='.repeat(60));
  console.log('Azure Key Vault Configuration Provider Demo');
  console.log('='.repeat(60));
  console.log();

  // Get Key Vault URL from environment variable
  const vaultUrl = process.env.AZURE_KEYVAULT_URL;
  if (!vaultUrl) {
    console.error('Error: AZURE_KEYVAULT_URL environment variable is not set');
    console.log('\nPlease set the environment variable:');
    console.log('  export AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net"');
    console.log('\nNote: This application uses DefaultAzureCredential for authentication.');
    console.log('Ensure you are authenticated via Azure CLI, managed identity, or other supported methods.');
    process.exit(1);
  }

  console.log(`Key Vault URL: ${vaultUrl}`);
  console.log('Authentication: Using DefaultAzureCredential (Managed Identity)\n');

  try {
    // Initialize providers
    console.log('--- Step 1: Initialize Providers ---\n');
    const secretProvider = new SecretProvider(vaultUrl);
    const cachingProvider = new CachingProvider(secretProvider, {
      expiryWarningDays: 7,
      autoRefreshExpiring: true,
    });
    const rotationHelper = new SecretRotationHelper(secretProvider);

    // Define config keys to load
    const configKeys = [
      'DatabaseConnectionString',
      'ApiKey',
      'ServiceBusConnectionString',
      'StorageAccountKey',
    ];

    // Define default values for graceful fallback
    const defaultValues = new Map<string, string>([
      ['DatabaseConnectionString', 'Server=localhost;Database=default'],
      ['ApiKey', 'default-api-key-12345'],
      ['ServiceBusConnectionString', 'Endpoint=sb://default.servicebus.windows.net/'],
      ['StorageAccountKey', 'DefaultEndpointsProtocol=https;AccountName=default'],
    ]);

    // Step 1: Bulk load configuration keys at startup
    console.log('--- Step 2: Bulk Load Configuration ---\n');
    await cachingProvider.bulkLoad(configKeys, defaultValues);

    // Step 2: Read secrets from cache
    console.log('--- Step 3: Read Secrets from Cache ---\n');
    for (const key of configKeys) {
      const value = await cachingProvider.get(key);
      const displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
      console.log(`${key}: ${displayValue}`);
    }
    console.log(`\nTotal cached secrets: ${cachingProvider.getCacheSize()}\n`);

    // Step 3: Refresh a single key
    console.log('--- Step 4: On-Demand Refresh ---\n');
    await cachingProvider.refresh('ApiKey', defaultValues.get('ApiKey'));

    // Step 4: Check for expiring secrets
    console.log('--- Step 5: Check for Expiring Secrets ---\n');
    const expiringSecrets = await cachingProvider.checkExpiringSecrets();
    if (expiringSecrets.length > 0) {
      console.log('⚠️  WARNING: The following secrets are expiring soon:\n');
      for (const secret of expiringSecrets) {
        console.log(`  • ${secret.name}`);
        console.log(`    Expires on: ${secret.expiresOn?.toISOString()}`);
        console.log(`    Days until expiry: ${secret.daysUntilExpiry}`);
        console.log();
      }
    } else {
      console.log('✓ No secrets are expiring soon\n');
    }

    // Step 5: Demonstrate secret rotation
    console.log('--- Step 6: Secret Rotation Demo ---\n');

    // Create a demo secret for rotation
    const demoSecretName = 'DemoRotationSecret';
    const initialValue = 'initial-secret-value-v1';
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90); // Expires in 90 days

    console.log(`Creating initial secret '${demoSecretName}'...`);
    await secretProvider.setSecret(demoSecretName, initialValue, expiryDate);
    console.log(`✓ Initial secret created\n`);

    // Rotate the secret with a new value
    const newValue = 'rotated-secret-value-v2';
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 180); // New version expires in 180 days

    await rotationHelper.rotateSecret(demoSecretName, {
      newValue,
      expiresOn: newExpiryDate,
      cleanupOldVersions: false, // Set to true to demonstrate cleanup
    });

    // Retrieve the new version
    const rotatedSecret = await secretProvider.getSecret(demoSecretName);
    console.log('Retrieved rotated secret:');
    console.log(`  Value: ${rotatedSecret.value}`);
    console.log(`  Version: ${rotatedSecret.version}`);
    console.log(`  Expires on: ${rotatedSecret.expiresOn?.toISOString()}\n`);

    // Step 6: Demonstrate delete and purge flow
    console.log('--- Step 7: Delete and Purge Demo ---\n');
    console.log('Note: Uncomment the following line to actually delete and purge the demo secret:');
    console.log('// await rotationHelper.deleteAndPurgeSecret(demoSecretName);\n');
    
    // Uncomment to actually perform delete and purge:
    // await rotationHelper.deleteAndPurgeSecret(demoSecretName);

    console.log('--- Demo Complete ---\n');
    console.log('Summary:');
    console.log('  ✓ Loaded configuration from Azure Key Vault');
    console.log('  ✓ Cached secrets for fast access');
    console.log('  ✓ Demonstrated on-demand refresh');
    console.log('  ✓ Checked for expiring secrets');
    console.log('  ✓ Rotated a secret with version management');
    console.log('  ✓ Showed safe delete/purge workflow\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    if (error.statusCode) {
      console.error(`Status code: ${error.statusCode}`);
    }
    console.error('\nTroubleshooting:');
    console.error('  1. Ensure AZURE_KEYVAULT_URL is set correctly');
    console.error('  2. Verify you have permissions to access the Key Vault');
    console.error('  3. Check that you are authenticated (az login or managed identity)');
    console.error('  4. Ensure the Key Vault exists and is accessible\n');
    process.exit(1);
  }
}

// Run the demo
main();
