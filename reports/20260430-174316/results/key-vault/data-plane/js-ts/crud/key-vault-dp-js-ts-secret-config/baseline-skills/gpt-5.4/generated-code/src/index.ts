import { createConfigurationModule } from "./config";
import { ResolvedSecret } from "./keyVaultSecretProvider";
import { CachedSecret, RequiredSecretDefinition } from "./secretCache";

function addDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function printSecret(
  label: string,
  secret: CachedSecret | ResolvedSecret,
): void {
  console.log(label, secret);
}

function requireVersion(version: string | undefined, secretName: string): string {
  if (!version) {
    throw new Error(`Secret "${secretName}" did not return a version identifier.`);
  }

  return version;
}

async function main(): Promise<void> {
  const configuration = createConfigurationModule();
  const { secretProvider, secretCache, secretRotationHelper } = configuration;

  console.log(`Connected to vault: ${configuration.vaultUrl}`);

  const requiredSecrets: RequiredSecretDefinition[] = [
    {
      name: "App--ApiBaseUrl",
      defaultValue: "https://fallback.example.internal",
    },
    {
      name: "App--FeatureFlag",
      defaultValue: "disabled",
    },
    {
      name: "App--ConnectionString",
      defaultValue: "UseDevelopmentStorage=true",
    },
  ];

  const preloaded = await secretCache.preload(requiredSecrets);
  console.log("\nLoaded required configuration keys at startup:");
  preloaded.forEach((secret) => printSecret("  ->", secret));

  const cachedConnectionString = await secretCache.get("App--ConnectionString", {
    defaultValue: "UseDevelopmentStorage=true",
  });
  console.log("\nRead one key from cache:");
  printSecret("  ->", cachedConnectionString);

  const refreshedFeatureFlag = await secretCache.refresh("App--FeatureFlag", {
    defaultValue: "disabled",
  });
  console.log("\nRefreshed one key on demand:");
  printSecret("  ->", refreshedFeatureFlag);

  const demoSecretName =
    process.env.DEMO_SECRET_NAME ?? `demo-config-${Date.now()}`;

  const firstVersion = await secretRotationHelper.rotateSecret(
    demoSecretName,
    "initial-demo-value",
    addDays(3),
  );
  const firstVersionId = requireVersion(
    firstVersion.properties.version,
    demoSecretName,
  );
  console.log("\nCreated an initial demo secret version:");
  console.log(`  -> name=${demoSecretName}, version=${firstVersionId}`);

  await secretCache.refresh(demoSecretName);
  await secretCache.refreshExpiringSecrets();

  const nearExpiry = secretCache.getExpiringSecrets();
  if (nearExpiry.length > 0) {
    console.log("\nWarning: these secrets are near expiry:");
    nearExpiry.forEach((secret) => printSecret("  ->", secret));
  } else {
    console.log("\nNo secrets are near expiry.");
  }

  const rotatedSecret = await secretRotationHelper.rotateSecret(
    demoSecretName,
    "rotated-demo-value",
    addDays(30),
  );
  const rotatedVersionId = requireVersion(
    rotatedSecret.properties.version,
    demoSecretName,
  );
  console.log("\nCreated a new secret version during rotation:");
  console.log(`  -> name=${demoSecretName}, version=${rotatedVersionId}`);

  const originalVersion = await secretProvider.getSecretVersion(
    demoSecretName,
    firstVersionId,
  );
  console.log("\nFetched the previous version explicitly:");
  printSecret("  ->", originalVersion);

  const latestVersion = await secretCache.refresh(demoSecretName);
  console.log("\nRefreshed cache with the newest version:");
  printSecret("  ->", latestVersion);

  await secretRotationHelper.deleteAndPurgeSecret(demoSecretName);
  console.log(
    "\nDeleted and purged the demo secret. The name is now fully reusable.",
  );
}

main().catch((error: unknown) => {
  console.error("Demo failed.", error);
  process.exitCode = 1;
});
