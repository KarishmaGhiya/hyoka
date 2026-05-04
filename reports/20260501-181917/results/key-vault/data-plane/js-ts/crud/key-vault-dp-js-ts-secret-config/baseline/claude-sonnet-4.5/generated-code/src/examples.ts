import { ConfigurationModule } from './ConfigurationModule';
import { SecretRotationHelper } from './SecretRotationHelper';

/**
 * Example: Simple configuration loading
 */
async function exampleSimpleConfig() {
  const config = new ConfigurationModule('https://your-vault.vault.azure.net/');
  
  // Initialize with required keys
  await config.initialize(['database-url', 'api-key']);
  
  // Get from cache
  const cachingProvider = config.getCachingProvider();
  const dbUrl = await cachingProvider.get('database-url');
  const apiKey = await cachingProvider.get('api-key', 'default-key');
  
  console.log('Database URL:', dbUrl);
  console.log('API Key:', apiKey);
}

/**
 * Example: Checking for expiring secrets
 */
async function exampleCheckExpiry() {
  const config = new ConfigurationModule(undefined, 7); // 7-day warning window
  await config.initialize(['secret1', 'secret2', 'secret3']);
  
  const cachingProvider = config.getCachingProvider();
  const expiringSecrets = cachingProvider.getExpiringSecrets();
  
  if (expiringSecrets.length > 0) {
    console.warn('⚠️  Secrets expiring soon:');
    expiringSecrets.forEach(s => {
      const days = Math.ceil((s.expiresOn.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      console.warn(`  - ${s.name}: ${days} days remaining`);
    });
    
    // Auto-refresh expiring secrets
    await cachingProvider.refreshExpiring();
  }
}

/**
 * Example: Secret rotation workflow
 */
async function exampleRotation() {
  const config = new ConfigurationModule();
  const provider = config.getProvider();
  const rotationHelper = new SecretRotationHelper(config.getClient(), provider);
  
  // Rotate a secret with new expiry
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 3); // 3 months from now
  
  const result = await rotationHelper.rotateSecret(
    'api-key',
    'new-secure-value-xyz',
    expiryDate
  );
  
  console.log(`Rotated from version ${result.oldVersion} to ${result.newVersion}`);
  
  // List all versions
  const versions = await rotationHelper.listVersions('api-key');
  console.log(`Total versions: ${versions.length}`);
}

/**
 * Example: Working with specific versions
 */
async function exampleVersions() {
  const config = new ConfigurationModule();
  const provider = config.getProvider();
  
  // Get specific version
  const value = await provider.getSecretVersion('api-key', 'abc123def456');
  console.log('Version abc123def456:', value);
  
  // Get full info including version
  const info = await provider.getSecretInfo('api-key');
  console.log('Current version:', info?.version);
  console.log('Expires on:', info?.expiresOn);
  console.log('Created on:', info?.createdOn);
  
  // Check if near expiry
  const isNear = provider.isNearExpiry(info?.expiresOn, 14); // 14-day window
  if (isNear) {
    console.warn('Secret is near expiry!');
  }
}

/**
 * Example: Safe secret cleanup
 */
async function exampleCleanup() {
  const config = new ConfigurationModule();
  const provider = config.getProvider();
  const rotationHelper = new SecretRotationHelper(config.getClient(), provider);
  
  // Safe delete and purge (waits for completion)
  await rotationHelper.deleteAndPurge('old-deprecated-secret');
  console.log('Secret permanently removed');
}

/**
 * Example: Cache management
 */
async function exampleCacheManagement() {
  const config = new ConfigurationModule();
  const cachingProvider = config.getCachingProvider();
  
  // Bulk load
  await cachingProvider.bulkLoad(['key1', 'key2', 'key3']);
  
  // Get cache stats
  const stats = cachingProvider.getCacheStats();
  console.log(`Cache size: ${stats.size}`);
  console.log(`Cached keys: ${stats.keys.join(', ')}`);
  
  // Refresh single key
  await cachingProvider.refresh('key1');
  
  // Clear entire cache
  cachingProvider.clearCache();
}

// Export examples for use
export {
  exampleSimpleConfig,
  exampleCheckExpiry,
  exampleRotation,
  exampleVersions,
  exampleCleanup,
  exampleCacheManagement,
};
