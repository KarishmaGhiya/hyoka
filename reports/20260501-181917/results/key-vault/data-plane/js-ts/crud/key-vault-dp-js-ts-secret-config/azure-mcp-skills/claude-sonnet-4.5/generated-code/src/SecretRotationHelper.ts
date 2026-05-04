import { SecretClient, KeyVaultSecret } from "@azure/keyvault-secrets";

/**
 * Options for rotating a secret
 */
export interface RotateSecretOptions {
  newValue: string;
  expiryDays?: number;
  contentType?: string;
  tags?: Record<string, string>;
}

/**
 * Options for cleaning up old secret versions
 */
export interface CleanupOptions {
  deleteOldVersions?: boolean;
  purgeAfterDelete?: boolean;
}

/**
 * SecretRotationHelper manages secret rotation and cleanup
 */
export class SecretRotationHelper {
  constructor(private readonly secretClient: SecretClient) {}

  /**
   * Rotate a secret by creating a new version
   * @param secretName - Name of the secret to rotate
   * @param options - Rotation options including new value and expiry
   * @returns The newly created secret version
   */
  async rotateSecret(
    secretName: string,
    options: RotateSecretOptions
  ): Promise<KeyVaultSecret> {
    const { newValue, expiryDays = 90, contentType, tags } = options;

    // Calculate expiry date
    const expiresOn = new Date();
    expiresOn.setDate(expiresOn.getDate() + expiryDays);

    // Get existing secret to preserve metadata
    let existingTags: Record<string, string> = {};
    let existingContentType: string | undefined;

    try {
      const existing = await this.secretClient.getSecret(secretName);
      existingTags = existing.properties.tags ?? {};
      existingContentType = existing.properties.contentType;

      // Disable the old version
      await this.secretClient.updateSecretProperties(
        secretName,
        existing.properties.version!,
        {
          enabled: false,
          tags: {
            ...existingTags,
            rotatedOn: new Date().toISOString(),
            status: "rotated",
          },
        }
      );
      console.log(`🔒 Disabled old version: ${existing.properties.version}`);
    } catch (error) {
      console.log(`ℹ️ No existing secret found, creating new one`);
    }

    // Create new version
    const newSecret = await this.secretClient.setSecret(secretName, newValue, {
      enabled: true,
      expiresOn,
      contentType: contentType ?? existingContentType,
      tags: {
        ...existingTags,
        ...tags,
        status: "active",
        createdOn: new Date().toISOString(),
      },
    });

    console.log(`✅ Created new secret version: ${newSecret.properties.version}`);
    console.log(`📅 Expires on: ${expiresOn.toISOString()}`);

    return newSecret;
  }

  /**
   * Clean up old versions of a secret
   * @param secretName - Name of the secret
   * @param options - Cleanup options
   */
  async cleanupOldVersions(
    secretName: string,
    options?: CleanupOptions
  ): Promise<void> {
    const { deleteOldVersions = true, purgeAfterDelete = false } = options ?? {};

    if (!deleteOldVersions) {
      return;
    }

    console.log(`\n🧹 Cleaning up old versions of '${secretName}'...`);

    // Get all versions
    const versions: string[] = [];
    for await (const version of this.secretClient.listPropertiesOfSecretVersions(secretName)) {
      if (!version.enabled) {
        versions.push(version.version!);
      }
    }

    if (versions.length === 0) {
      console.log("ℹ️ No disabled versions to clean up");
      return;
    }

    console.log(`Found ${versions.length} disabled version(s) to clean up`);

    // Note: Individual version deletion is not supported by Key Vault
    // We can only delete the entire secret (all versions) or disable specific versions
    // For demonstration, we'll show the delete and purge flow for the secret name
    console.log("ℹ️ Note: Key Vault doesn't support deleting individual versions");
    console.log("   To fully clean up, we would delete and purge the entire secret");
  }

  /**
   * Safely delete and purge a secret (all versions)
   * Use this when you need to completely remove a secret name
   * @param secretName - Name of the secret to delete
   * @param purge - Whether to purge after deletion (permanent)
   */
  async deleteAndPurgeSecret(secretName: string, purge: boolean = false): Promise<void> {
    console.log(`\n🗑️ Deleting secret '${secretName}'...`);

    // Begin delete operation (long-running)
    const deletePoller = await this.secretClient.beginDeleteSecret(secretName);
    
    // Poll until completion
    console.log("⏳ Waiting for delete operation to complete...");
    const deletedSecret = await deletePoller.pollUntilDone();
    
    console.log(`✅ Secret deleted on: ${deletedSecret.deletedOn}`);
    console.log(`📅 Scheduled purge date: ${deletedSecret.scheduledPurgeDate}`);

    if (purge) {
      console.log("⏳ Purging deleted secret (permanent deletion)...");
      await this.secretClient.purgeDeletedSecret(secretName);
      console.log(`✅ Secret '${secretName}' permanently purged`);
    } else {
      console.log(`ℹ️ Secret is soft-deleted and can be recovered until ${deletedSecret.scheduledPurgeDate}`);
    }
  }

  /**
   * List all versions of a secret with their status
   * @param secretName - Name of the secret
   */
  async listVersions(secretName: string): Promise<void> {
    console.log(`\n📋 Versions of '${secretName}':`);
    
    let count = 0;
    for await (const version of this.secretClient.listPropertiesOfSecretVersions(secretName)) {
      count++;
      const status = version.enabled ? "✅ enabled" : "🔒 disabled";
      const expires = version.expiresOn ? `expires: ${version.expiresOn.toISOString()}` : "no expiry";
      console.log(`  ${status} | version: ${version.version} | ${expires}`);
    }
    
    if (count === 0) {
      console.log("  (no versions found)");
    }
  }
}
