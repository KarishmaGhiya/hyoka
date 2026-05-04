import { SecretClient } from "@azure/keyvault-secrets";

export interface RotateSecretOptions {
  /** New value for the secret. */
  newValue: string;
  /** Expiry date for the new version. */
  expiresOn: Date;
  /**
   * When true, delete and purge the *previous* version's secret name so the
   * name can be fully reused. Uses the long-running delete operation and waits
   * for completion before purging (required by Key Vault's soft-delete).
   */
  cleanupOldSecret?: boolean;
  /** Content type metadata (e.g. "text/plain"). */
  contentType?: string;
}

export interface RotationResult {
  name: string;
  newVersion: string | undefined;
  expiresOn: Date | undefined;
  oldVersionCleaned: boolean;
}

/**
 * Safely rotates a secret in Azure Key Vault.
 *
 * Creates a new version with an updated value and expiry date, and optionally
 * deletes + purges the previous secret (for full name reuse scenarios).
 */
export class SecretRotationHelper {
  constructor(private readonly client: SecretClient) {}

  /**
   * Rotate a secret: set a new version, optionally clean up old versions.
   */
  async rotate(
    secretName: string,
    options: RotateSecretOptions,
  ): Promise<RotationResult> {
    // Capture the current version before creating a new one
    let previousVersion: string | undefined;
    if (options.cleanupOldSecret) {
      try {
        const current = await this.client.getSecret(secretName);
        previousVersion = current.properties.version;
      } catch {
        // Secret may not exist yet — nothing to clean up
      }
    }

    // Create a new version by setting the secret with updated value and properties
    const newSecret = await this.client.setSecret(secretName, options.newValue, {
      expiresOn: options.expiresOn,
      contentType: options.contentType,
    });

    let oldVersionCleaned = false;

    if (options.cleanupOldSecret && previousVersion) {
      await this.deleteAndPurge(secretName);
      oldVersionCleaned = true;
    }

    return {
      name: secretName,
      newVersion: newSecret.properties.version,
      expiresOn: newSecret.properties.expiresOn,
      oldVersionCleaned,
    };
  }

  /**
   * Delete a secret using the long-running operation and wait for it to
   * complete, then purge so the name is fully freed.
   *
   * Key Vault's soft-delete means a deleted secret is retained for a
   * recovery period — purging permanently removes it.
   */
  async deleteAndPurge(secretName: string): Promise<void> {
    // beginDeleteSecret returns a poller; await it to wait for deletion
    const poller = await this.client.beginDeleteSecret(secretName);
    await poller.pollUntilDone();

    // Now permanently purge the soft-deleted secret
    await this.client.purgeDeletedSecret(secretName);
  }
}
