import { ConfigurationModule } from "./ConfigurationModule.js";
import { SecretRotationHelper } from "./SecretRotationHelper.js";

/**
 * Quick usage examples for the Azure Key Vault Configuration Provider
 */

// Example 1: Basic setup and secret retrieval
async function basicUsage() {
  const config = new ConfigurationModule({ expiryWarningDays: 7 });
  const cache = config.getCachedProvider();

  // Get a secret (from cache or fetch if not cached)
  const dbConnection = await cache.get("database-connection-string", "default-connection");
  console.log("DB Connection:", dbConnection.substring(0, 10) + "***");

  // Force refresh a secret
  const apiKey = await cache.refresh("api-key");
  console.log("API Key refreshed");
}

// Example 2: Bulk loading at startup
async function bulkLoadExample() {
  const config = new ConfigurationModule();
  const cache = config.getCachedProvider();

  // Load all required config at startup
  const requiredSecrets = [
    "database-connection-string",
    "api-key",
    "jwt-secret",
    "smtp-password",
    "storage-account-key"
  ];

  await cache.bulkLoad(requiredSecrets);
  console.log("All configuration loaded");

  // Access from cache (no network call)
  const jwtSecret = await cache.get("jwt-secret");
}

// Example 3: Monitoring secret expiry
async function monitorExpiry() {
  const config = new ConfigurationModule({ expiryWarningDays: 30 });
  const cache = config.getCachedProvider();

  // Load secrets
  await cache.bulkLoad(["cert-password", "api-token"]);

  // Check for expiring secrets
  const expiring = await cache.getExpiringSecrets();
  
  for (const secret of expiring) {
    console.warn(
      `⚠️ Secret '${secret.secretName}' expires in ${secret.daysUntilExpiry} days!`
    );
    
    // Could trigger an alert, email, or automatic rotation here
  }

  // Auto-refresh secrets near expiry
  const refreshed = await cache.refreshExpiring();
  console.log(`Refreshed ${refreshed.length} expiring secrets`);
}

// Example 4: Secret rotation
async function rotationExample() {
  const config = new ConfigurationModule();
  const rotationHelper = new SecretRotationHelper(config.getSecretClient());

  // Rotate a secret with a new value
  const newSecret = await rotationHelper.rotateSecret("api-key", {
    newValue: generateNewApiKey(), // Your key generation logic
    expiryDays: 90,
    contentType: "text/plain",
    tags: {
      environment: "production",
      rotatedBy: "automated-rotation",
      rotatedAt: new Date().toISOString()
    }
  });

  console.log(`Rotated secret, new version: ${newSecret.properties.version}`);
  
  // List all versions
  await rotationHelper.listVersions("api-key");
}

// Example 5: Working with specific versions
async function versionedSecretsExample() {
  const config = new ConfigurationModule();
  const provider = config.getSecretProvider();

  // Get latest version
  const latestValue = await provider.getSecret("my-secret");

  // Get specific version
  const specificVersion = await provider.getSecretVersion(
    "my-secret",
    "abc123def456"
  );

  // Check expiry of a specific version
  const expiryInfo = await provider.getExpiryInfo("my-secret", "abc123def456");
  console.log(`Expires in ${expiryInfo.daysUntilExpiry} days`);
}

// Example 6: Error handling and defaults
async function errorHandlingExample() {
  const config = new ConfigurationModule();
  const cache = config.getCachedProvider();

  // Gracefully handle missing secrets with defaults
  const optionalFeatureFlag = await cache.get("feature-flag-new-ui", "false");
  
  // Check if exists before accessing
  if (cache.has("optional-config")) {
    const value = await cache.get("optional-config");
    console.log("Optional config:", value);
  } else {
    console.log("Optional config not found, using defaults");
  }
}

// Example 7: Cache management
async function cacheManagementExample() {
  const config = new ConfigurationModule();
  const cache = config.getCachedProvider();

  await cache.bulkLoad(["secret1", "secret2", "secret3"]);

  // Get cache statistics
  const stats = cache.getCacheStats();
  console.log(`Cache contains ${stats.size} secrets`);
  
  stats.entries.forEach(entry => {
    console.log(`- ${entry.name}: fetched at ${entry.fetchedAt}`);
  });

  // Clear cache if needed (e.g., after rotation)
  cache.clear();
  console.log("Cache cleared");
}

// Helper function (example)
function generateNewApiKey(): string {
  return `key_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Export examples
export {
  basicUsage,
  bulkLoadExample,
  monitorExpiry,
  rotationExample,
  versionedSecretsExample,
  errorHandlingExample,
  cacheManagementExample
};
