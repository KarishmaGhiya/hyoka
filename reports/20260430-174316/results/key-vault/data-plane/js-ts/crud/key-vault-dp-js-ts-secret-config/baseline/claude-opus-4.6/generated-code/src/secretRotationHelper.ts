import { SecretClient } from "@azure/keyvault-secrets";

export interface RotationResult {
  name: string;
  newVersion: string;
  expiresOn: Date;
}

/**
 * Helpers for safely rotating secrets in Azure Key Vault.
 */
export class SecretRotationHelper {
  constructor(private readonly client: SecretClient) {}

  /**
   * Create a new version of an existing secret with an updated value and
   * expiry date. Key Vault stores every version, so the previous value
   * remains accessible via its version id.
   */
  async createNewVersion(
    name: string,
    newValue: string,
    expiresOn: Date
  ): Promise<RotationResult> {
    const result = await this.client.setSecret(name, newValue, {
      expiresOn,
    });

    return {
      name: result.name,
      newVersion: result.properties.version!,
      expiresOn: result.properties.expiresOn!,
    };
  }

  /**
   * Delete a secret (all versions) and purge it from the soft-delete
   * holding area so the name can be fully reused.
   *
   * Key Vault's soft-delete means `beginDeleteSecret` returns a long-running
   * poller. We wait for that to complete before calling `purgeDeletedSecret`.
   */
  async deleteAndPurge(name: string): Promise<void> {
    const poller = await this.client.beginDeleteSecret(name);
    await poller.pollUntilDone();
    await this.client.purgeDeletedSecret(name);
  }
}
