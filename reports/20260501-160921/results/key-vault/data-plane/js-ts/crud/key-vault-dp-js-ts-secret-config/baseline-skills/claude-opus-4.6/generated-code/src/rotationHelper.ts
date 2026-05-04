import { SecretClient } from "@azure/keyvault-secrets";

export interface RotationResult {
  name: string;
  newVersion: string;
  expiresOn?: Date;
}

/**
 * Safely rotates a Key Vault secret:
 * 1. Creates a new version with an updated value and expiry date.
 * 2. Optionally cleans up the old secret by soft-deleting then purging it
 *    (useful when full name reuse requires all previous versions to be gone).
 *
 * The cleanup honours Key Vault's soft-delete semantics — it awaits the
 * long-running delete operation before attempting the purge.
 */
export class SecretRotationHelper {
  constructor(private readonly client: SecretClient) {}

  /**
   * Create a new version of an existing secret.
   *
   * Because Key Vault natively versions secrets, calling `setSecret` with
   * the same name produces a new version while the old versions remain
   * accessible.
   */
  async createNewVersion(
    name: string,
    newValue: string,
    expiresOn: Date,
  ): Promise<RotationResult> {
    const secret = await this.client.setSecret(name, newValue, {
      expiresOn,
      enabled: true,
    });

    return {
      name: secret.name,
      newVersion: secret.properties.version!,
      expiresOn: secret.properties.expiresOn,
    };
  }

  /**
   * Soft-delete the secret and then permanently purge it.
   *
   * This is a destructive operation — **all versions** of the named secret
   * are removed.  The method waits for the long-running delete to complete
   * (soft-delete transition) before issuing the purge so the vault does not
   * reject the purge request.
   */
  async deleteAndPurge(name: string): Promise<void> {
    // Begin the soft-delete and wait for it to complete.
    const poller = await this.client.beginDeleteSecret(name);
    await poller.pollUntilDone();

    // Now that the secret is in the "deleted" state, permanently purge it.
    await this.client.purgeDeletedSecret(name);
  }
}
