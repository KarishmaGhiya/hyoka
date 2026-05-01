import { SecretClient } from "@azure/keyvault-secrets";

export interface RotationOptions {
  /** New value for the secret. */
  newValue: string;
  /** When the new secret version should expire. */
  expiresOn?: Date;
  /** Content type (e.g. "text/plain", "application/json"). */
  contentType?: string;
  /**
   * If true, delete and purge the previous secret version.
   * This is a destructive operation – use only when full name reuse is needed.
   */
  purgeOldVersion?: boolean;
}

export interface RotationResult {
  name: string;
  newVersion: string;
  previousVersion?: string;
  purged: boolean;
}

export class SecretRotationHelper {
  constructor(private readonly client: SecretClient) {}

  /**
   * Rotate a secret by creating a new version with an updated value
   * and (optionally) an expiry date.
   *
   * If `purgeOldVersion` is set, the entire secret name is deleted and
   * purged first (Key Vault soft-delete), then the secret is recreated.
   * This waits for the long-running delete operation to complete before
   * purging, because Key Vault's soft-delete means the secret is not
   * immediately gone.
   */
  async rotate(
    name: string,
    options: RotationOptions
  ): Promise<RotationResult> {
    let previousVersion: string | undefined;

    // Capture the current version before rotation (if the secret exists).
    try {
      const current = await this.client.getSecret(name);
      previousVersion = current.properties.version;
    } catch {
      // Secret may not exist yet – that's fine.
    }

    let purged = false;

    if (options.purgeOldVersion && previousVersion) {
      await this.deleteAndPurge(name);
      purged = true;
    }

    // Create a new version (or the initial version after purge).
    const newSecret = await this.client.setSecret(name, options.newValue, {
      expiresOn: options.expiresOn,
      contentType: options.contentType,
    });

    return {
      name,
      newVersion: newSecret.properties.version ?? "unknown",
      previousVersion,
      purged,
    };
  }

  /**
   * Safely delete and purge a secret.
   *
   * Key Vault soft-delete means `beginDeleteSecret` starts a long-running
   * operation. We poll until the delete completes, then call `purgeDeletedSecret`
   * to permanently remove it.
   */
  async deleteAndPurge(name: string): Promise<void> {
    console.log(`Starting delete of secret "${name}"...`);

    const poller = await this.client.beginDeleteSecret(name);

    // Wait for the delete to complete (soft-delete recovery period).
    console.log(`Waiting for delete of "${name}" to complete...`);
    await poller.pollUntilDone();

    console.log(
      `Delete of "${name}" complete. Purging permanently...`
    );
    await this.client.purgeDeletedSecret(name);

    console.log(`Secret "${name}" has been permanently purged.`);
  }
}
