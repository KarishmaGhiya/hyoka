import { createConfigurationModule } from "./configuration";
import { SecretRequest } from "./types";

const WARNING_WINDOW_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * MS_PER_DAY);
}

function formatDate(value: Date | null): string {
  return value ? value.toISOString() : "none";
}

function formatValue(value: string | undefined): string {
  return value ?? "<undefined>";
}

function formatRemainingDays(remainingMs: number): string {
  return `${(remainingMs / MS_PER_DAY).toFixed(2)} days`;
}

async function seedDemoSecrets(module: ReturnType<typeof createConfigurationModule>): Promise<void> {
  console.log("Seeding demo secrets...");

  await module.rotationHelper.rotateSecretVersion(
    "demo-app-api-key",
    "api-key-v1",
    daysFromNow(30),
  );
  await module.rotationHelper.rotateSecretVersion(
    "demo-app-endpoint",
    "https://api.contoso.internal",
    daysFromNow(45),
  );
  await module.rotationHelper.rotateSecretVersion(
    "demo-expiring-soon",
    "replace-me-soon",
    daysFromNow(2),
  );
  await module.rotationHelper.rotateSecretVersion(
    "demo-rotating-secret",
    "rotation-v1",
    daysFromNow(14),
  );
}

function printSecret(label: string, secret: {
  name: string;
  value: string | undefined;
  version: string | null;
  expiresOn: Date | null;
  found: boolean;
  usedDefault: boolean;
  cacheStatus?: string;
}): void {
  console.log(`${label}:`, {
    name: secret.name,
    value: formatValue(secret.value),
    version: secret.version,
    expiresOn: formatDate(secret.expiresOn),
    found: secret.found,
    usedDefault: secret.usedDefault,
    cacheStatus: secret.cacheStatus,
  });
}

async function main(): Promise<void> {
  const requiredSecrets: SecretRequest[] = [
    { name: "demo-app-api-key" },
    { name: "demo-app-endpoint" },
    { name: "demo-expiring-soon" },
    {
      name: "demo-missing-secret",
      defaultValue: "fallback-config-value",
    },
  ];

  const module = createConfigurationModule({
    expiryWarningWindowMs: WARNING_WINDOW_DAYS * MS_PER_DAY,
    requiredSecrets,
  });

  console.log("Connected to Key Vault with managed identity.");
  console.log("Vault URL:", process.env.KEY_VAULT_URL);

  await seedDemoSecrets(module);

  console.log("\nBulk-loading required config keys...");
  const startupSecrets = await module.cache.preloadRequiredSecrets();
  startupSecrets.forEach((secret) => printSecret("Startup load", secret));

  console.log("\nReading configuration from cache...");
  const cachedApiKey = await module.cache.get("demo-app-api-key");
  const cachedEndpoint = await module.cache.get("demo-app-endpoint");
  const cachedMissing = await module.cache.get("demo-missing-secret", {
    defaultValue: "fallback-config-value",
  });
  const cachedExpiring = await module.cache.get("demo-expiring-soon");

  [cachedApiKey, cachedEndpoint, cachedMissing, cachedExpiring].forEach((secret) =>
    printSecret("Cache read", secret),
  );

  console.log("\nRefreshing one config key after creating a new version...");
  const apiKeyRotation = await module.rotationHelper.rotateSecretVersion(
    "demo-app-api-key",
    "api-key-v2",
    daysFromNow(60),
  );
  console.log("Created a new version:", apiKeyRotation);

  const refreshedApiKey = await module.cache.refresh("demo-app-api-key");
  printSecret("Refreshed key", refreshedApiKey);

  if (apiKeyRotation.previousVersion) {
    console.log("\nRetrieving the previous secret version directly from the provider...");
    const previousVersion = await module.provider.getSecret("demo-app-api-key", {
      version: apiKeyRotation.previousVersion,
    });
    printSecret("Previous version", previousVersion);
  }

  console.log("\nChecking for cached secrets near expiry...");
  const nearExpirySecrets = module.cache.getNearExpirySecrets();
  if (nearExpirySecrets.length === 0) {
    console.log("No cached secrets are nearing expiry.");
  } else {
    nearExpirySecrets.forEach((secret) => {
      console.warn("Expiry warning:", {
        name: secret.name,
        version: secret.version,
        expiresOn: formatDate(secret.expiresOn),
        remaining: formatRemainingDays(secret.remainingMs),
      });
    });
  }

  console.log("\nRotating a demo secret and demonstrating delete-plus-purge cleanup...");
  const rotationResult = await module.rotationHelper.rotateSecretVersion(
    "demo-rotating-secret",
    "rotation-v2",
    daysFromNow(90),
  );
  console.log("Rotation result:", rotationResult);

  const deleteAndPurgeResult = await module.rotationHelper.deleteAndPurgeSecret(
    "demo-rotating-secret",
  );
  console.log("Delete and purge result:", {
    ...deleteAndPurgeResult,
    deletedOn: formatDate(deleteAndPurgeResult.deletedOn),
    scheduledPurgeDate: formatDate(deleteAndPurgeResult.scheduledPurgeDate),
  });
}

main().catch((error: unknown) => {
  console.error("Demo failed:", error);
  process.exit(1);
});
