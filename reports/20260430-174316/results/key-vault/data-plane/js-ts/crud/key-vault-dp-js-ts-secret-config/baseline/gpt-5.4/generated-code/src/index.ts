import { createKeyVaultConfiguration } from "./configuration";
import { CachedSecretRecord, SecretRequest } from "./types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function formatDate(date?: Date): string {
  return date === undefined ? "not set" : date.toISOString();
}

function logSecret(secret: CachedSecretRecord): void {
  console.log(
    `- ${secret.name}: value="${secret.value}", source=${secret.source}, version=${secret.version ?? "n/a"}, expiresOn=${formatDate(secret.expiresOn)}`,
  );
}

function getRequiredVersion(version: string | undefined, secretName: string): string {
  if (version === undefined || version.trim() === "") {
    throw new Error(`Key Vault did not return a version for secret "${secretName}".`);
  }

  return version;
}

async function main(): Promise<void> {
  const warningWindowDays = Number(process.env.SECRET_EXPIRY_WARNING_DAYS ?? "7");
  const warningWindowMs = warningWindowDays * DAY_IN_MS;
  const configuration = createKeyVaultConfiguration({
    expiryWarningWindowMs: warningWindowMs,
  });
  const demoPrefix = process.env.DEMO_SECRET_PREFIX ?? `demo-${Date.now()}`;
  const apiSecretName = `${demoPrefix}-api-base-url`;
  const dbSecretName = `${demoPrefix}-db-password`;
  const featureSecretName = `${demoPrefix}-feature-flag`;
  const missingSecretName = `${demoPrefix}-missing-setting`;
  const cleanupSecretName = `${demoPrefix}-cleanup-secret`;

  console.log(`Using Key Vault: ${configuration.vaultUrl}`);
  console.log(
    `Managed identity: ${process.env.AZURE_CLIENT_ID ?? "system-assigned"}`,
  );
  console.log(`Expiry warning window: ${warningWindowDays} day(s)`);
  console.log(`Demo secret prefix: ${demoPrefix}`);

  console.log("\n1. Seeding demo secrets");
  const initialApiSecret = await configuration.rotationHelper.rotateSecret(
    apiSecretName,
    "https://api.initial.contoso.example",
    new Date(Date.now() + 30 * DAY_IN_MS),
  );
  const initialDbSecret = await configuration.rotationHelper.rotateSecret(
    dbSecretName,
    "db-password-v1",
    new Date(Date.now() + 2 * DAY_IN_MS),
  );
  await configuration.rotationHelper.rotateSecret(
    featureSecretName,
    "enabled",
    new Date(Date.now() + 5 * DAY_IN_MS),
  );
  await configuration.rotationHelper.rotateSecret(
    cleanupSecretName,
    "cleanup-v1",
    new Date(Date.now() + 10 * DAY_IN_MS),
  );
  console.log(
    `Seeded ${apiSecretName}, ${dbSecretName}, ${featureSecretName}, and ${cleanupSecretName}.`,
  );

  console.log("\n2. Bulk-loading required config keys into cache");
  const requiredSecrets: SecretRequest[] = [
    { name: apiSecretName, defaultValue: "https://fallback.example" },
    { name: dbSecretName, defaultValue: "local-db-password" },
    { name: featureSecretName, defaultValue: "disabled" },
    { name: missingSecretName, defaultValue: "missing-default" },
  ];
  const preloadedSecrets = await configuration.cache.preloadSecrets(requiredSecrets);
  preloadedSecrets.forEach(logSecret);

  console.log("\n3. Reading secrets from the in-memory cache");
  logSecret(
    await configuration.cache.getSecret({
      name: apiSecretName,
      defaultValue: "https://fallback.example",
    }),
  );
  logSecret(
    await configuration.cache.getSecret({
      name: missingSecretName,
      defaultValue: "missing-default",
    }),
  );

  console.log("\n4. Inspecting expiry metadata");
  const featureExpiry = await configuration.provider.inspectExpiry(
    featureSecretName,
    undefined,
    warningWindowMs,
  );

  if (featureExpiry === undefined) {
    console.log(`- ${featureSecretName}: not found`);
  } else {
    console.log(
      `- ${featureExpiry.name}: expiresOn=${formatDate(featureExpiry.expiresOn)}, expiringSoon=${featureExpiry.isExpiringSoon}, daysUntilExpiry=${featureExpiry.daysUntilExpiry ?? "n/a"}`,
    );
  }

  console.log("\n5. Rotating a secret and retrieving a specific older version");
  const initialApiVersion = getRequiredVersion(
    initialApiSecret.properties.version,
    apiSecretName,
  );
  const rotatedApiSecret = await configuration.rotationHelper.rotateSecret(
    apiSecretName,
    "https://api.rotated.contoso.example",
    new Date(Date.now() + 60 * DAY_IN_MS),
  );
  console.log(
    `Created new version ${rotatedApiSecret.properties.version ?? "unknown"} for ${apiSecretName}.`,
  );

  const previousApiVersion = await configuration.provider.getSecret(
    apiSecretName,
    "unavailable",
    initialApiVersion,
  );
  console.log(
    `Fetched previous version ${previousApiVersion.version ?? initialApiVersion} with value "${previousApiVersion.value}".`,
  );

  console.log("\n6. Forcing a manual refresh of one cached key");
  const refreshedApiSecret = await configuration.cache.refreshSecret({
    name: apiSecretName,
    defaultValue: "https://fallback.example",
  });
  logSecret(refreshedApiSecret);

  console.log("\n7. Demonstrating automatic refresh for a near-expiry cached secret");
  console.log(
    `Cache currently has ${dbSecretName} version ${initialDbSecret.properties.version ?? "unknown"} expiring on ${formatDate(initialDbSecret.properties.expiresOn)}.`,
  );
  const rotatedDbSecret = await configuration.rotationHelper.rotateSecret(
    dbSecretName,
    "db-password-v2",
    new Date(Date.now() + 45 * DAY_IN_MS),
  );
  console.log(
    `Created new version ${rotatedDbSecret.properties.version ?? "unknown"} for ${dbSecretName}.`,
  );
  const automaticallyRefreshedDbSecret = await configuration.cache.getSecret({
    name: dbSecretName,
    defaultValue: "local-db-password",
  });
  logSecret(automaticallyRefreshedDbSecret);

  console.log("\n8. Printing warnings for secrets still near expiry");
  const expiringSecrets = configuration.cache.getSecretsNearExpiry();

  if (expiringSecrets.length === 0) {
    console.log("- No cached secrets are currently inside the warning window.");
  } else {
    expiringSecrets.forEach((secret) => {
      console.log(
        `- WARNING: ${secret.name} expires on ${formatDate(secret.expiresOn)} and should be rotated soon.`,
      );
    });
  }

  console.log("\n9. Demonstrating safe delete-and-purge cleanup for full name reuse");
  await configuration.rotationHelper.rotateSecret(
    cleanupSecretName,
    "cleanup-v2",
    new Date(Date.now() + 20 * DAY_IN_MS),
  );
  console.log(`Created an additional version for ${cleanupSecretName}.`);
  await configuration.rotationHelper.deleteAndPurgeSecret(cleanupSecretName);
  console.log(`Deleted and purged ${cleanupSecretName}.`);
  const recreatedCleanupSecret = await configuration.rotationHelper.rotateSecret(
    cleanupSecretName,
    "cleanup-v3",
    new Date(Date.now() + 30 * DAY_IN_MS),
  );
  console.log(
    `Recreated ${cleanupSecretName} after purge with version ${recreatedCleanupSecret.properties.version ?? "unknown"}.`,
  );

  console.log("\nDemo complete.");
}

main().catch((error: unknown) => {
  console.error("Demo failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
