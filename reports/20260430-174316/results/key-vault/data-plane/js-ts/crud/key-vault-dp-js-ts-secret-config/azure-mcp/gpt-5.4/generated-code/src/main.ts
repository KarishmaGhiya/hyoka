import { createAppConfigServices } from "./config";
import { CachedSecretRecord } from "./types";

const WARNING_WINDOW_DAYS = Number(process.env.EXPIRY_WARNING_DAYS ?? "7");
const WARNING_WINDOW_MS = WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000;

interface DemoSecretConfig {
  name: string;
  defaultValue: string;
}

function buildDemoSecretConfigs(): DemoSecretConfig[] {
  return [
    {
      name: process.env.DEMO_CONFIG_KEY_ONE ?? "demo-app-db-password",
      defaultValue: "local-db-password"
    },
    {
      name: process.env.DEMO_CONFIG_KEY_TWO ?? "demo-app-api-key",
      defaultValue: "local-api-key"
    },
    {
      name: process.env.DEMO_CONFIG_KEY_THREE ?? "demo-feature-flag",
      defaultValue: "disabled"
    }
  ];
}

function formatDate(value?: Date): string {
  return value ? value.toISOString() : "n/a";
}

function maskSecret(value: string): string {
  if (value.length <= 4) {
    return "*".repeat(value.length);
  }

  return `${value.slice(0, 2)}${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-2)}`;
}

function describeSecret(secret: CachedSecretRecord): Record<string, string | boolean> {
  return {
    name: secret.name,
    version: secret.version ?? "n/a",
    valuePreview: maskSecret(secret.value),
    expiresOn: formatDate(secret.expiresOn),
    isDefault: secret.isDefault,
    isNearExpiry: secret.isNearExpiry,
    cacheUpdatedAt: secret.cacheUpdatedAt.toISOString()
  };
}

async function run(): Promise<void> {
  const demoConfigs = buildDemoSecretConfigs();
  const requiredKeys = demoConfigs.map((entry) => entry.name);
  const defaultValues = Object.fromEntries(demoConfigs.map((entry) => [entry.name, entry.defaultValue]));

  const { provider, cache, rotationHelper } = createAppConfigServices(
    requiredKeys,
    defaultValues,
    WARNING_WINDOW_MS
  );

  console.log("1. Preloading required configuration keys into the in-memory cache...");
  const preloadedSecrets = await cache.preload();
  preloadedSecrets.forEach((secret) => {
    console.log("   ", describeSecret(secret));
  });

  console.log("\n2. Reading the same keys from the cache...");
  for (const key of requiredKeys) {
    const cachedSecret = await cache.get(key);
    console.log("   ", describeSecret(cachedSecret));
  }

  console.log("\n3. Refreshing one key on demand...");
  const refreshedSecret = await cache.refresh(requiredKeys[0]);
  console.log("   ", describeSecret(refreshedSecret));

  console.log(`\n4. Auto-refreshing cached secrets that expire within ${WARNING_WINDOW_DAYS} day(s)...`);
  const refreshedExpiringSecrets = await cache.refreshExpiringSecrets();
  if (refreshedExpiringSecrets.length === 0) {
    console.log("    No cached secrets were within the warning window.");
  } else {
    refreshedExpiringSecrets.forEach((secret) => {
      console.log("   ", describeSecret(secret));
    });
  }

  const nearExpirySecrets = cache.listNearExpirySecrets();
  console.log("\n5. Expiry inspection...");
  if (nearExpirySecrets.length === 0) {
    console.log("    No cached secrets are near expiry.");
  } else {
    nearExpirySecrets.forEach((secret) => {
      console.warn(
        `    Warning: ${secret.name} expires on ${formatDate(secret.expiresOn)} and is inside the warning window.`
      );
    });
  }

  const rotationSecretName = process.env.ROTATION_SECRET_NAME ?? "demo-rotating-secret";
  console.log(`\n6. Reading the current state of '${rotationSecretName}' before rotation...`);
  const existingRotationSecret = await provider.getSecret(rotationSecretName, {
    defaultValue: "secret-not-created-yet"
  });
  console.log("   ", {
    name: existingRotationSecret.name,
    version: existingRotationSecret.version ?? "n/a",
    valuePreview: maskSecret(existingRotationSecret.value),
    expiresOn: formatDate(existingRotationSecret.expiresOn),
    isDefault: existingRotationSecret.isDefault
  });

  console.log("\n7. Rotating the secret by creating a new version...");
  const rotatedSecret = await rotationHelper.rotateSecret(
    rotationSecretName,
    `rotated-${Date.now()}`,
    {
      expiresOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tags: {
        rotatedBy: "demo-script"
      }
    }
  );
  console.log("   ", {
    name: rotatedSecret.name,
    version: rotatedSecret.version ?? "n/a",
    valuePreview: maskSecret(rotatedSecret.value),
    expiresOn: formatDate(rotatedSecret.expiresOn)
  });

  console.log("\n8. Inspecting the specific rotated version...");
  const rotatedVersion = await provider.getSecret(rotationSecretName, {
    version: rotatedSecret.version
  });
  console.log("   ", {
    name: rotatedVersion.name,
    version: rotatedVersion.version ?? "n/a",
    valuePreview: maskSecret(rotatedVersion.value),
    expiresOn: formatDate(rotatedVersion.expiresOn)
  });

  console.log("\n9. Demonstrating the safe delete-and-purge cleanup flow...");
  if (process.env.DEMO_ALLOW_PURGE === "true") {
    console.warn(
      "    Cleanup is enabled. Deleting and purging the secret name removes every version under that name."
    );
    await rotationHelper.deleteAndPurgeSecret(rotationSecretName);
    console.log(`    Secret '${rotationSecretName}' was deleted, the long-running operation completed, and purge finished.`);
  } else {
    console.log(
      "    Skipped destructive cleanup. Set DEMO_ALLOW_PURGE=true to run the long-running delete and purge demonstration."
    );
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error("Demo failed:", message);
  process.exitCode = 1;
});
