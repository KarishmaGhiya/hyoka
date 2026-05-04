import { SecretClient } from "@azure/keyvault-secrets";

export interface RotationOptions {
  expiresOn?: Date;
  contentType?: string;
  tags?: Record<string, string>;
}

export class SecretRotationHelper {
  constructor(private client: SecretClient) {}

  /**
   * Safely rotate a secret by creating a new version
   */
  async rotateSecret(
    name: string,
    newValue: string,
    options?: RotationOptions
  ): Promise<string> {
    console.log(`\n🔄 Rotating secret '${name}'...`);

    // Create new version
    const secret = await this.client.setSecret(name, newValue, {
      expiresOn: options?.expiresOn,
      contentType: options?.contentType,
      tags: options?.tags,
    });

    console.log(`✅ Created new version: ${secret.properties.version}`);
    return secret.properties.version!;
  }

  /**
   * Delete a specific version of a secret (soft delete)
   */
  async deleteSecretVersion(name: string, version: string): Promise<void> {
    console.log(`🗑️  Deleting version ${version} of secret '${name}'...`);

    // Note: Key Vault does not support deleting specific versions directly
    // You can only delete the entire secret, which affects all versions
    console.warn(
      "⚠️  Key Vault does not support deleting individual versions. Use deleteSecret to delete all versions."
    );
  }

  /**
   * Safely delete and purge a secret (complete removal)
   * This uses the long-running delete operation and waits for completion
   */
  async deleteAndPurgeSecret(name: string): Promise<void> {
    console.log(`\n🗑️  Initiating soft delete for secret '${name}'...`);

    try {
      // Begin delete operation (soft delete with long-running operation)
      const deletePoller = await this.client.beginDeleteSecret(name);

      console.log("⏳ Waiting for delete operation to complete...");
      const deletedSecret = await deletePoller.pollUntilDone();

      console.log(
        `✅ Secret soft-deleted. Scheduled purge date: ${deletedSecret.properties.scheduledPurgeDate}`
      );

      // Now purge permanently
      console.log("🔥 Purging secret permanently...");
      await this.client.purgeDeletedSecret(name);

      console.log("✅ Secret purged permanently");
    } catch (error: any) {
      if (error.code === "SecretNotFound") {
        console.log(`ℹ️  Secret '${name}' does not exist`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Recover a soft-deleted secret
   */
  async recoverSecret(name: string): Promise<void> {
    console.log(`\n♻️  Recovering soft-deleted secret '${name}'...`);

    try {
      const recoverPoller = await this.client.beginRecoverDeletedSecret(name);

      console.log("⏳ Waiting for recovery to complete...");
      await recoverPoller.pollUntilDone();

      console.log("✅ Secret recovered successfully");
    } catch (error: any) {
      if (error.code === "SecretNotFound") {
        console.log(`ℹ️  No deleted secret named '${name}' found`);
      } else {
        throw error;
      }
    }
  }

  /**
   * List all versions of a secret
   */
  async listSecretVersions(name: string): Promise<string[]> {
    const versions: string[] = [];

    try {
      for await (const versionProps of this.client.listPropertiesOfSecretVersions(
        name
      )) {
        if (versionProps.version) {
          versions.push(versionProps.version);
        }
      }
    } catch (error: any) {
      if (error.code === "SecretNotFound") {
        return [];
      }
      throw error;
    }

    return versions;
  }

  /**
   * Get the latest version of a secret without retrieving the value
   */
  async getLatestVersion(name: string): Promise<string | null> {
    try {
      const secret = await this.client.getSecret(name);
      return secret.properties.version || null;
    } catch (error: any) {
      if (error.code === "SecretNotFound") {
        return null;
      }
      throw error;
    }
  }
}
