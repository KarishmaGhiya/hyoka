import { SecretClient, SetSecretOptions } from "@azure/keyvault-secrets";
import { TokenCredential } from "@azure/core-auth";

export interface RotationOptions {
  expiryDays?: number;
  contentType?: string;
  tags?: Record<string, string>;
}

export class SecretRotationHelper {
  private client: SecretClient;

  constructor(vaultUrl: string, credential: TokenCredential) {
    this.client = new SecretClient(vaultUrl, credential);
  }

  /**
   * Safely rotates a secret by creating a new version with updated value and expiry.
   * @param secretName - The name of the secret to rotate
   * @param newValue - The new secret value
   * @param options - Rotation options including expiry days
   * @returns The version ID of the new secret version
   */
  async rotateSecret(
    secretName: string,
    newValue: string,
    options: RotationOptions = {}
  ): Promise<string> {
    const expiryDate = options.expiryDays
      ? new Date(Date.now() + options.expiryDays * 24 * 60 * 60 * 1000)
      : undefined;

    const setOptions: SetSecretOptions = {
      expiresOn: expiryDate,
      contentType: options.contentType,
      tags: options.tags,
    };

    console.log(`Rotating secret '${secretName}'...`);
    const secret = await this.client.setSecret(secretName, newValue, setOptions);

    console.log(
      `Secret '${secretName}' rotated successfully. New version: ${secret.properties.version}`
    );
    if (expiryDate) {
      console.log(`  Expires on: ${expiryDate.toISOString()}`);
    }

    return secret.properties.version || "";
  }

  /**
   * Deletes a specific version of a secret (soft delete).
   * This is a long-running operation that must complete before purging.
   * @param secretName - The name of the secret
   * @param version - Optional version to delete (if omitted, deletes current version)
   * @returns The deleted secret's recovery ID
   */
  async deleteSecretVersion(
    secretName: string,
    version?: string
  ): Promise<string> {
    console.log(
      `Deleting secret '${secretName}'${version ? ` version ${version}` : ""}...`
    );

    // Begin the delete operation (this is a long-running operation)
    const poller = await this.client.beginDeleteSecret(secretName);

    // Wait for the deletion to complete
    const deletedSecret = await poller.pollUntilDone();

    console.log(
      `Secret '${secretName}' deleted successfully (soft delete).`
    );
    console.log(`  Recovery ID: ${deletedSecret.recoveryId}`);
    console.log(`  Scheduled purge date: ${deletedSecret.scheduledPurgeDate}`);

    return deletedSecret.recoveryId || "";
  }

  /**
   * Purges a soft-deleted secret permanently.
   * This can only be called after delete has completed.
   * WARNING: This is irreversible!
   * @param secretName - The name of the secret to purge
   */
  async purgeDeletedSecret(secretName: string): Promise<void> {
    console.log(`Purging deleted secret '${secretName}'...`);

    try {
      await this.client.purgeDeletedSecret(secretName);
      console.log(`Secret '${secretName}' purged successfully (permanent).`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.warn(`Secret '${secretName}' not found in deleted secrets.`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Performs a complete secret rotation with cleanup:
   * 1. Creates a new version of the secret
   * 2. Optionally deletes and purges the old secret for full name reuse
   * @param secretName - The name of the secret
   * @param newValue - The new secret value
   * @param options - Rotation options
   * @param cleanup - Whether to delete and purge the old version
   * @returns The new version ID
   */
  async rotateWithCleanup(
    secretName: string,
    newValue: string,
    options: RotationOptions = {},
    cleanup: boolean = false
  ): Promise<string> {
    // Create new version
    const newVersion = await this.rotateSecret(secretName, newValue, options);

    if (cleanup) {
      console.log("Performing cleanup of old secret version...");

      // Delete the secret (soft delete)
      await this.deleteSecretVersion(secretName);

      // Wait a bit for the delete to fully propagate
      console.log("Waiting for delete to propagate before purging...");
      await this.sleep(5000);

      // Purge permanently
      await this.purgeDeletedSecret(secretName);

      console.log("Cleanup complete.");
    }

    return newVersion;
  }

  /**
   * Lists all deleted secrets that can be recovered or purged.
   * @returns Array of deleted secret names
   */
  async listDeletedSecrets(): Promise<string[]> {
    const deletedSecrets: string[] = [];
    for await (const properties of this.client.listDeletedSecrets()) {
      deletedSecrets.push(properties.name);
    }
    return deletedSecrets;
  }

  /**
   * Recovers a soft-deleted secret.
   * @param secretName - The name of the secret to recover
   */
  async recoverDeletedSecret(secretName: string): Promise<void> {
    console.log(`Recovering deleted secret '${secretName}'...`);
    const poller = await this.client.beginRecoverDeletedSecret(secretName);
    await poller.pollUntilDone();
    console.log(`Secret '${secretName}' recovered successfully.`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
